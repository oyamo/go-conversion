package registry

import (
	"fmt"
	"strings"
	"sync"
)

type Converter struct {
	From     string
	To       string
	MIMEType string
	Label    string
	Convert  func(data []byte) ([]byte, error)
}

func key(from, to string) string {
	return strings.ToLower(from) + "→" + strings.ToLower(to)
}

var (
	mu         sync.RWMutex
	converters = make(map[string]Converter)

	password   string
	passwordMu sync.RWMutex
)

func SetPassword(pass string) {
	passwordMu.Lock()
	password = pass
	passwordMu.Unlock()
}

func GetPassword() string {
	passwordMu.RLock()
	defer passwordMu.RUnlock()
	return password
}

func Register(c Converter) error {
	if c.From == "" || c.To == "" {
		return fmt.Errorf("from and to formats must not be empty")
	}
	if c.Convert == nil {
		return fmt.Errorf("convert function must not be nil")
	}

	k := key(c.From, c.To)

	mu.Lock()
	defer mu.Unlock()

	if _, exists := converters[k]; exists {
		return fmt.Errorf("converter already registered for %s to %s", c.From, c.To)
	}

	converters[k] = c
	return nil
}

func Lookup(from, to string) (Converter, bool) {
	mu.RLock()
	defer mu.RUnlock()

	c, ok := converters[key(from, to)]
	return c, ok
}

func Convert(data []byte, from, to string) ([]byte, error) {
	c, ok := Lookup(from, to)
	if !ok {
		return nil, fmt.Errorf("no converter registered for %s → %s", from, to)
	}
	return c.Convert(data)
}

func All() []Converter {
	mu.RLock()
	defer mu.RUnlock()

	result := make([]Converter, 0, len(converters))
	for _, c := range converters {
		result = append(result, c)
	}
	return result
}

func IsRegistered(from, to string) bool {
	_, ok := Lookup(from, to)
	return ok
}
