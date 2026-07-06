package image

import (
	"bytes"
	"image/jpeg"
	"image/png"
	"go-wasm/internal/registry"
)

func convertJpegToPng(data []byte) ([]byte, error) {
	img, err := jpeg.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	err = png.Encode(&buf, img)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "jpeg",
		To:       "png",
		MIMEType: "image/png",
		Label:    "JPEG to PNG",
		Convert:  convertJpegToPng,
	})

	registry.Register(registry.Converter{
		From:     "jpg",
		To:       "png",
		MIMEType: "image/png",
		Label:    "JPG to PNG",
		Convert:  convertJpegToPng,
	})
}
