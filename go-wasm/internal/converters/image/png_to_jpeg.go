package image

import (
	"bytes"
	"image/jpeg"
	"image/png"
	"go-wasm/internal/registry"
)

func convertPngToJpeg(data []byte) ([]byte, error) {
	img, err := png.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 90})
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "png",
		To:       "jpeg",
		MIMEType: "image/jpeg",
		Label:    "PNG to JPEG",
		Convert:  convertPngToJpeg,
	})

	registry.Register(registry.Converter{
		From:     "png",
		To:       "jpg",
		MIMEType: "image/jpeg",
		Label:    "PNG to JPG",
		Convert:  convertPngToJpeg,
	})
}
