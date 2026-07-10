package document

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"
	"go-wasm/internal/registry"
)

func convertMdToHtml(data []byte) ([]byte, error) {
	text := string(data)
	lines := strings.Split(text, "\n")

	var html bytes.Buffer
	html.WriteString("<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<title>Converted Document</title>\n<style>\nbody { font-family: sans-serif; line-height: 1.6; margin: 40px; color: #333; }\nh1 { color: #111; }\ntable { border-collapse: collapse; width: 100%; margin: 20px 0; }\nth, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\nth { background-color: #f2f2f2; }\n</style>\n</head>\n<body>\n")

	reLink := regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
	reImage := regexp.MustCompile(`\!\[([^\]]*)\]\(([^)]+)\)`)

	inList := false
	inTable := false

	for _, line := range lines {
		line = strings.TrimRight(line, "\r")
		trimmed := strings.TrimSpace(line)

		if len(trimmed) == 0 {
			if inList {
				html.WriteString("</ul>\n")
				inList = false
			}
			if inTable {
				html.WriteString("</table>\n")
				inTable = false
			}
			continue
		}

		// 1. Check table rows
		if strings.HasPrefix(trimmed, "|") && strings.HasSuffix(trimmed, "|") {
			if inList {
				html.WriteString("</ul>\n")
				inList = false
			}
			if !inTable {
				html.WriteString("<table>\n")
				inTable = true
			}

			isDivider := true
			parts := strings.Split(trimmed, "|")
			var cells []string
			for _, part := range parts {
				partTrimmed := strings.TrimSpace(part)
				if partTrimmed != "" {
					if !strings.Contains(partTrimmed, "---") && !strings.Contains(partTrimmed, ":") {
						isDivider = false
					}
					cells = append(cells, partTrimmed)
				}
			}

			if isDivider {
				continue
			}

			html.WriteString("<tr>\n")
			for _, cell := range cells {
				cell = reImage.ReplaceAllString(cell, `<img src="$2" alt="$1" style="max-width:100px; height:auto;" />`)
				cell = reLink.ReplaceAllString(cell, `<a href="$2" style="color:#2563eb;">$1</a>`)
				html.WriteString(fmt.Sprintf("  <td>%s</td>\n", cell))
			}
			html.WriteString("</tr>\n")
			continue
		}

		if inTable {
			html.WriteString("</table>\n")
			inTable = false
		}

		// 2. Check list items
		if strings.HasPrefix(trimmed, "- ") || strings.HasPrefix(trimmed, "* ") {
			if !inList {
				html.WriteString("<ul>\n")
				inList = true
			}
			content := strings.TrimPrefix(strings.TrimPrefix(trimmed, "- "), "* ")
			content = reImage.ReplaceAllString(content, `<img src="$2" alt="$1" style="max-width:100%; height:auto;" />`)
			content = reLink.ReplaceAllString(content, `<a href="$2" style="color:#2563eb;">$1</a>`)
			html.WriteString(fmt.Sprintf("<li>%s</li>\n", content))
			continue
		}

		if inList {
			html.WriteString("</ul>\n")
			inList = false
		}

		// 3. Process headings and normal text
		var formattedLine string
		if strings.HasPrefix(trimmed, "# ") {
			formattedLine = fmt.Sprintf("<h1>%s</h1>\n", strings.TrimPrefix(trimmed, "# "))
		} else if strings.HasPrefix(trimmed, "## ") {
			formattedLine = fmt.Sprintf("<h2>%s</h2>\n", strings.TrimPrefix(trimmed, "## "))
		} else if strings.HasPrefix(trimmed, "### ") {
			formattedLine = fmt.Sprintf("<h3>%s</h3>\n", strings.TrimPrefix(trimmed, "### "))
		} else {
			processed := reImage.ReplaceAllString(trimmed, `<img src="$2" alt="$1" style="max-width:100%; height:auto; margin:10px 0;" />`)
			processed = reLink.ReplaceAllString(processed, `<a href="$2" style="color:#2563eb; text-decoration:underline;">$1</a>`)
			formattedLine = fmt.Sprintf("<p>%s</p>\n", processed)
		}

		html.WriteString(formattedLine)
	}

	if inList {
		html.WriteString("</ul>\n")
	}
	if inTable {
		html.WriteString("</table>\n")
	}

	html.WriteString("</body>\n</html>\n")
	return html.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "md",
		To:       "html",
		MIMEType: "text/html",
		Label:    "Markdown to HTML",
		Convert:  convertMdToHtml,
	})
}
