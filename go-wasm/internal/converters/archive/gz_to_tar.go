package archive

import (
	"bytes"
	"compress/gzip"
	"io"
	"go-wasm/internal/registry"
)

func convertGzToTar(data []byte) ([]byte, error) {
	gr, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer gr.Close()

	var buf bytes.Buffer
	_, err = io.Copy(&buf, gr)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "gz",
		To:       "tar",
		MIMEType: "application/x-tar",
		Label:    "GZ to TAR",
		Convert:  convertGzToTar,
	})
}
