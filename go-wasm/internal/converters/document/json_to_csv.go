package document

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"go-wasm/internal/registry"
)

func convertJsonToCsv(data []byte) ([]byte, error) {
	var list []map[string]any
	
	err := json.Unmarshal(data, &list)
	if err != nil {
		var single map[string]any
		err2 := json.Unmarshal(data, &single)
		if err2 != nil {
			return nil, fmt.Errorf("invalid JSON: must be array or object")
		}
		list = append(list, single)
	}

	if len(list) == 0 {
		return []byte(""), nil
	}

	var headers []string
	headerMap := make(map[string]bool)
	for _, item := range list {
		for k := range item {
			if !headerMap[k] {
				headerMap[k] = true
				headers = append(headers, k)
			}
		}
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)

	err = w.Write(headers)
	if err != nil {
		return nil, err
	}

	for _, item := range list {
		row := make([]string, len(headers))
		for j, h := range headers {
			val, ok := item[h]
			if ok && val != nil {
				row[j] = fmt.Sprintf("%v", val)
			} else {
				row[j] = ""
			}
		}
		err = w.Write(row)
		if err != nil {
			return nil, err
		}
	}

	w.Flush()
	return buf.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "json",
		To:       "csv",
		MIMEType: "text/csv",
		Label:    "JSON to CSV",
		Convert:  convertJsonToCsv,
	})
}
