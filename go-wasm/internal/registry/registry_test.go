package registry

import (
	"testing"
)

func TestRegisterAndLookup(t *testing.T) {
	// Setup a test converter
	testConv := Converter{
		From:     "tst",
		To:       "out",
		MIMEType: "text/plain",
		Label:    "Test to Out",
		Convert: func(data []byte) ([]byte, error) {
			return append(data, []byte(" converted")...), nil
		},
	}

	// Register it
	if err := Register(testConv); err != nil {
		t.Fatalf("Expected registration to succeed, got error: %v", err)
	}

	// Verify lookup works
	c, ok := Lookup("tst", "out")
	if !ok {
		t.Fatal("Expected converter to be registered")
	}

	if c.From != "tst" || c.To != "out" || c.Label != "Test to Out" {
		t.Errorf("Registered converter values do not match: %+v", c)
	}

	// Test conversion interface
	res, err := Convert([]byte("hello"), "tst", "out")
	if err != nil {
		t.Fatalf("Conversion failed: %v", err)
	}
	if string(res) != "hello converted" {
		t.Errorf("Expected 'hello converted', got '%s'", string(res))
	}
}

func TestDuplicateRegisterReturnsError(t *testing.T) {
	testConv := Converter{
		From:     "dup",
		To:       "out",
		MIMEType: "text/plain",
		Label:    "Duplicate 1",
		Convert: func(data []byte) ([]byte, error) {
			return data, nil
		},
	}

	if err := Register(testConv); err != nil {
		t.Fatalf("Expected first registration to succeed, got: %v", err)
	}

	if err := Register(testConv); err == nil {
		t.Error("Expected second registration to return error, got nil")
	}
}

func TestLookupNonExistent(t *testing.T) {
	_, ok := Lookup("xyz", "abc")
	if ok {
		t.Error("Expected lookup for non-existent converter to return false")
	}

	_, err := Convert([]byte("data"), "xyz", "abc")
	if err == nil {
		t.Error("Expected Convert for non-existent converter to return error")
	}
}
