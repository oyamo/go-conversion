package document

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"go-wasm/internal/registry"
)

func convertCsvToJson(data []byte) ([]byte, error) {
	r := csv.NewReader(bytes.NewReader(data))
	r.FieldsPerRecord = -1
	records, err := r.ReadAll()
	if err != nil {
		return nil, err
	}

	if len(records) == 0 {
		return []byte("[]"), nil
	}

	headers := records[0]
	var list []map[string]string

	for i := 1; i < len(records); i++ {
		row := records[i]
		item := make(map[string]string)
		for j, val := range row {
			if j < len(headers) {
				item[headers[j]] = val
			} else {
				item[fmt.Sprintf("column_%d", j)] = val
			}
		}
		list = append(list, item)
	}

	output, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return nil, err
	}

	return output, nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "csv",
		To:       "json",
		MIMEType: "application/json",
		Label:    "CSV to JSON",
		Convert:  convertCsvToJson,
	})
}
