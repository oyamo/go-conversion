package document

import (
	"bytes"
	"regexp"
	"strings"
	"go-wasm/internal/registry"
)

func convertHtmlToMd(data []byte) ([]byte, error) {
	html := string(data)

	// Strip CSS styles and headers
	reStyle := regexp.MustCompile(`(?s)<style[^>]*>.*?</style>`)
	html = reStyle.ReplaceAllString(html, "")

	reTitle := regexp.MustCompile(`(?s)<title[^>]*>.*?</title>`)
	html = reTitle.ReplaceAllString(html, "")

	reHead := regexp.MustCompile(`(?s)<head[^>]*>.*?</head>`)
	html = reHead.ReplaceAllString(html, "")

	// 1. Block conversions
	reH1 := regexp.MustCompile(`<h1>(.*?)</h1>`)
	html = reH1.ReplaceAllString(html, "\n# $1\n")

	reH2 := regexp.MustCompile(`<h2>(.*?)</h2>`)
	html = reH2.ReplaceAllString(html, "\n## $1\n")

	reH3 := regexp.MustCompile(`<h3>(.*?)</h3>`)
	html = reH3.ReplaceAllString(html, "\n### $1\n")

	reLi := regexp.MustCompile(`<li>(.*?)</li>`)
	html = reLi.ReplaceAllString(html, "\n- $1")

	// 2. Inline conversions
	reLink := regexp.MustCompile(`<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)</a>`)
	html = reLink.ReplaceAllString(html, "[$2]($1)")

	reImg1 := regexp.MustCompile(`<img\s+[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>`)
	html = reImg1.ReplaceAllString(html, "![$2]($1)")

	reImg2 := regexp.MustCompile(`<img\s+[^>]*alt="([^"]*)"[^>]*src="([^"]+)"[^>]*>`)
	html = reImg2.ReplaceAllString(html, "![$1]($2)")

	// 3. Table conversions
	reTr := regexp.MustCompile(`(?s)<tr>(.*?)</tr>`)
	html = reTr.ReplaceAllStringFunc(html, func(trContent string) string {
		reCell := regexp.MustCompile(`<(?:td|th)[^>]*>(.*?)</(?:td|th)>`)
		matches := reCell.FindAllStringSubmatch(trContent, -1)
		
		var cells []string
		for _, m := range matches {
			cells = append(cells, strings.TrimSpace(m[1]))
		}
		
		if len(cells) > 0 {
			return "\n| " + strings.Join(cells, " | ") + " |\n"
		}
		return ""
	})

	// 4. Strip remaining HTML tags
	reTags := regexp.MustCompile(`</?[a-zA-Z0-9]+[^>]*>`)
	html = reTags.ReplaceAllString(html, "")

	// Clean up common entities
	html = strings.ReplaceAll(html, "&amp;", "&")
	html = strings.ReplaceAll(html, "&lt;", "<")
	html = strings.ReplaceAll(html, "&gt;", ">")
	html = strings.ReplaceAll(html, "&quot;", "\"")
	html = strings.ReplaceAll(html, "&#39;", "'")

	// Split and cleanup whitespace
	lines := strings.Split(html, "\n")
	var result bytes.Buffer
	lastEmpty := false
	
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if len(trimmed) == 0 {
			if !lastEmpty {
				result.WriteString("\n")
				lastEmpty = true
			}
			continue
		}
		result.WriteString(trimmed + "\n")
		lastEmpty = false
	}

	return result.Bytes(), nil
}

func init() {
	registry.Register(registry.Converter{
		From:     "html",
		To:       "md",
		MIMEType: "text/markdown",
		Label:    "HTML to Markdown",
		Convert:  convertHtmlToMd,
	})
}
