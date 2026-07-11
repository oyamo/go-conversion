package archive

import (
	"archive/tar"
	"bytes"
	"compress/flate"
	"encoding/binary"
	"errors"
	"fmt"
	"hash/crc32"
	"io"
	"strings"
	"go-wasm/internal/registry"
)

var (
	ErrZipPasswordRequired  = errors.New("password-required")
	ErrZipPasswordIncorrect = errors.New("password-incorrect")
)

type zipCrypto struct {
	keys [3]uint32
}

var crc32Table = crc32.IEEETable

func newZipCrypto(password []byte) *zipCrypto {
	zc := &zipCrypto{
		keys: [3]uint32{305419896, 591751049, 878082192},
	}
	for _, b := range password {
		zc.updateKeys(b)
	}
	return zc
}

func (zc *zipCrypto) updateKeys(b byte) {
	zc.keys[0] = (zc.keys[0] >> 8) ^ crc32Table[byte(zc.keys[0])^b]
	zc.keys[1] = zc.keys[1] + (zc.keys[0]&0xff)
	zc.keys[1] = zc.keys[1]*134775813 + 1
	zc.keys[2] = (zc.keys[2] >> 8) ^ crc32Table[byte(zc.keys[2])^byte(zc.keys[1]>>24)]
}

func (zc *zipCrypto) decryptByte(c byte) byte {
	temp := uint16(zc.keys[2]) | 2
	b := c ^ byte((temp*(temp^1))>>8)
	zc.updateKeys(b)
	return b
}

func convertZipToTar(data []byte) ([]byte, error) {
	// Find End of Central Directory (EOCD) signature (0x06054b50)
	eocdOffset := -1
	for i := len(data) - 22; i >= 0; i-- {
		if data[i] == 0x50 && data[i+1] == 0x4b && data[i+2] == 0x05 && data[i+3] == 0x06 {
			eocdOffset = i
			break
		}
	}
	if eocdOffset == -1 {
		return nil, fmt.Errorf("invalid ZIP archive: EOCD signature not found")
	}

	cdEntries := binary.LittleEndian.Uint16(data[eocdOffset+8 : eocdOffset+10])
	cdOffset := binary.LittleEndian.Uint32(data[eocdOffset+16 : eocdOffset+20])

	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)

	password := registry.GetPassword()

	// Iterate through Central Directory records (signature 0x02014b50)
	offset := int(cdOffset)
	for entry := 0; entry < int(cdEntries); entry++ {
		if offset+46 > len(data) {
			break
		}
		sig := binary.LittleEndian.Uint32(data[offset : offset+4])
		if sig != 0x02014b50 {
			break
		}

		flags := binary.LittleEndian.Uint16(data[offset+8 : offset+10])
		method := binary.LittleEndian.Uint16(data[offset+10 : offset+12])
		modTime := binary.LittleEndian.Uint16(data[offset+12 : offset+14])
		crc32Val := binary.LittleEndian.Uint32(data[offset+16 : offset+20])
		compSize := binary.LittleEndian.Uint32(data[offset+20 : offset+24])
		uncompSize := binary.LittleEndian.Uint32(data[offset+24 : offset+28])
		nameLen := binary.LittleEndian.Uint16(data[offset+28 : offset+30])
		extraLen := binary.LittleEndian.Uint16(data[offset+30 : offset+32])
		commentLen := binary.LittleEndian.Uint16(data[offset+32 : offset+34])
		localOffset := binary.LittleEndian.Uint32(data[offset+42 : offset+46])

		fileName := string(data[offset+46 : offset+46+int(nameLen)])
		offset += 46 + int(nameLen) + int(extraLen) + int(commentLen)

		// Parse Local File Header (LFH offset)
		lfhOffset := int(localOffset)
		if lfhOffset+30 > len(data) {
			continue
		}
		lfhSig := binary.LittleEndian.Uint32(data[lfhOffset : lfhOffset+4])
		if lfhSig != 0x04034b50 {
			continue
		}
		lfhNameLen := binary.LittleEndian.Uint16(data[lfhOffset+26 : lfhOffset+28])
		lfhExtraLen := binary.LittleEndian.Uint16(data[lfhOffset+28 : lfhOffset+30])

		dataStart := lfhOffset + 30 + int(lfhNameLen) + int(lfhExtraLen)
		dataEnd := dataStart + int(compSize)
		if dataEnd > len(data) {
			continue
		}

		// Skip folder listings
		if strings.HasSuffix(fileName, "/") {
			continue
		}

		fileBytes := data[dataStart:dataEnd]
		isEncrypted := flags&1 != 0

		if isEncrypted && password == "" {
			return nil, ErrZipPasswordRequired
		}
		if isEncrypted && len(fileBytes) < 12 {
			return nil, fmt.Errorf("corrupted encrypted file payload")
		}

		if isEncrypted {
			zc := newZipCrypto([]byte(password))
			// Decrypt 12-byte encryption header
			decHeader := make([]byte, 12)
			for i := 0; i < 12; i++ {
				decHeader[i] = zc.decryptByte(fileBytes[i])
			}

			// Verify password correctness using checkByte
			checkByte := byte(crc32Val >> 24)
			if flags&8 != 0 {
				checkByte = byte(modTime >> 8)
			}
			if decHeader[11] != checkByte {
				return nil, ErrZipPasswordIncorrect
			}

			// Decrypt remaining data payload
			encPayload := fileBytes[12:]
			decPayload := make([]byte, len(encPayload))
			for i := 0; i < len(encPayload); i++ {
				decPayload[i] = zc.decryptByte(encPayload[i])
			}
			fileBytes = decPayload
		}

		// Decompress payload based on method type
		var finalData []byte
		if method == 8 {
			fr := flate.NewReader(bytes.NewReader(fileBytes))
			var decBuf bytes.Buffer
			_, err := io.Copy(&decBuf, fr)
			fr.Close()
			if err != nil {
				return nil, fmt.Errorf("decompression failure: %v", err)
			}
			finalData = decBuf.Bytes()
		} else if method == 0 {
			finalData = fileBytes
		} else {
			return nil, fmt.Errorf("unsupported compression method: %d", method)
		}

		// Write entry details directly to Tarball
		header := &tar.Header{
			Name: fileName,
			Size: int64(uncompSize),
			Mode: 0600,
		}

		err := tw.WriteHeader(header)
		if err != nil {
			return nil, err
		}

		_, err = io.Copy(tw, bytes.NewReader(finalData))
		if err != nil {
			return nil, err
		}
	}

	err := tw.Close()
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "zip",
		To:       "tar",
		MIMEType: "application/x-tar",
		Label:    "ZIP to TAR",
		Convert:  convertZipToTar,
	})
}
