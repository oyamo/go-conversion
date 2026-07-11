package archive

import (
	"archive/zip"
	"bytes"
	"errors"
	"fmt"
	"io"
	"github.com/nwaples/rardecode/v2"
	"go-wasm/internal/registry"
)

var (
	ErrPasswordRequired  = errors.New("password-required")
	ErrPasswordIncorrect = errors.New("password-incorrect")
)

func convertRarToZip(data []byte) ([]byte, error) {
	password := registry.GetPassword()

	// Initialize the RAR reader with the password option
	rr, err := rardecode.NewReader(bytes.NewReader(data), rardecode.Password(password))
	if errors.Is(err, rardecode.ErrArchiveEncrypted) || errors.Is(err, rardecode.ErrArchivedFileEncrypted) {
		return nil, ErrPasswordRequired
	}
	if errors.Is(err, rardecode.ErrBadPassword) {
		return nil, ErrPasswordIncorrect
	}
	if err != nil {
		return nil, err
	}

	var zipBuf bytes.Buffer
	zw := zip.NewWriter(&zipBuf)

	for {
		header, err := rr.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if errors.Is(err, rardecode.ErrArchiveEncrypted) || errors.Is(err, rardecode.ErrArchivedFileEncrypted) {
			return nil, ErrPasswordRequired
		}
		if errors.Is(err, rardecode.ErrBadPassword) {
			return nil, ErrPasswordIncorrect
		}
		if err != nil {
			return nil, err
		}

		// Skip directories
		if header.IsDir {
			continue
		}

		// Check if file is encrypted and password was not provided
		if header.Encrypted && password == "" {
			return nil, ErrPasswordRequired
		}

		// Create file header in the output ZIP archive
		zf, err := zw.Create(header.Name)
		if err != nil {
			return nil, err
		}

		// Stream decompressed/decrypted contents to the ZIP writer
		_, err = io.Copy(zf, rr)
		if errors.Is(err, rardecode.ErrArchiveEncrypted) || errors.Is(err, rardecode.ErrArchivedFileEncrypted) {
			return nil, ErrPasswordRequired
		}
		if errors.Is(err, rardecode.ErrBadPassword) {
			return nil, ErrPasswordIncorrect
		}
		if err != nil {
			return nil, err
		}
	}

	err = zw.Close()
	if err != nil {
		return nil, err
	}

	return zipBuf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "rar",
		To:       "zip",
		MIMEType: "application/zip",
		Label:    "RAR to ZIP",
		Convert:  convertRarToZip,
	})
}
