package archive

import (
	"bytes"
	"compress/gzip"
	"go-wasm/internal/registry"
)

func convertTarToGz(data []byte) ([]byte, error) {
	var buf bytes.Buffer
	gw := gzip.NewWriter(&buf)

	_, err := gw.Write(data)
	if err != nil {
		gw.Close()
		return nil, err
	}

	err = gw.Close()
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "tar",
		To:       "gz",
		MIMEType: "application/gzip",
		Label:    "TAR to GZ",
		Convert:  convertTarToGz,
	})
}
