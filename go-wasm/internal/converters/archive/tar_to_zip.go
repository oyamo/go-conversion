package archive

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"io"
	"go-wasm/internal/registry"
)

func convertTarToZip(data []byte) ([]byte, error) {
	tr := tar.NewReader(bytes.NewReader(data))

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		if header.Typeflag == tar.TypeDir {
			continue
		}

		zf, err := zw.Create(header.Name)
		if err != nil {
			return nil, err
		}

		_, err = io.Copy(zf, tr)
		if err != nil {
			return nil, err
		}
	}

	err := zw.Close()
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "tar",
		To:       "zip",
		MIMEType: "application/zip",
		Label:    "TAR to ZIP",
		Convert:  convertTarToZip,
	})
}
