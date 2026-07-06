package image

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"

	"go-wasm/internal/registry"
)

func createTestImage() image.Image {
	// Create a simple 2x2 RGBA image
	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	img.Set(0, 0, color.RGBA{255, 0, 0, 255})     // Red
	img.Set(1, 0, color.RGBA{0, 255, 0, 255})     // Green
	img.Set(0, 1, color.RGBA{0, 0, 255, 255})     // Blue
	img.Set(1, 1, color.RGBA{255, 255, 255, 255}) // White
	return img
}

func TestPngToJpegConversion(t *testing.T) {
	// 1. Generate test image PNG bytes
	img := createTestImage()
	var pngBuf bytes.Buffer
	if err := png.Encode(&pngBuf, img); err != nil {
		t.Fatalf("Failed to encode test image to PNG: %v", err)
	}

	// 2. Perform registry lookup
	conv, ok := registry.Lookup("png", "jpeg")
	if !ok {
		t.Fatal("Expected 'png' to 'jpeg' converter to be registered")
	}

	// 3. Execute conversion
	jpegBytes, err := conv.Convert(pngBuf.Bytes())
	if err != nil {
		t.Fatalf("PNG to JPEG conversion failed: %v", err)
	}

	// 4. Verify output is a valid JPEG
	decodedImg, err := jpeg.Decode(bytes.NewReader(jpegBytes))
	if err != nil {
		t.Fatalf("Result is not a valid JPEG: %v", err)
	}

	// Verify dimensions match
	bounds := decodedImg.Bounds()
	if bounds.Dx() != 2 || bounds.Dy() != 2 {
		t.Errorf("Expected 2x2 image, got %dx%d", bounds.Dx(), bounds.Dy())
	}
}

func TestJpegToPngConversion(t *testing.T) {
	// 1. Generate test image JPEG bytes
	img := createTestImage()
	var jpegBuf bytes.Buffer
	if err := jpeg.Encode(&jpegBuf, img, nil); err != nil {
		t.Fatalf("Failed to encode test image to JPEG: %v", err)
	}

	// 2. Perform registry lookup
	conv, ok := registry.Lookup("jpeg", "png")
	if !ok {
		t.Fatal("Expected 'jpeg' to 'png' converter to be registered")
	}

	// 3. Execute conversion
	pngBytes, err := conv.Convert(jpegBuf.Bytes())
	if err != nil {
		t.Fatalf("JPEG to PNG conversion failed: %v", err)
	}

	// 4. Verify output is a valid PNG
	decodedImg, err := png.Decode(bytes.NewReader(pngBytes))
	if err != nil {
		t.Fatalf("Result is not a valid PNG: %v", err)
	}

	// Verify dimensions match
	bounds := decodedImg.Bounds()
	if bounds.Dx() != 2 || bounds.Dy() != 2 {
		t.Errorf("Expected 2x2 image, got %dx%d", bounds.Dx(), bounds.Dy())
	}
}
