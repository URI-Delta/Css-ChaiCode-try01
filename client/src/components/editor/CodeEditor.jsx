import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { useMemo } from 'react';

export default function CodeEditor({ value, language = 'html', onChange, readOnly, height = '100%' }) {
  const extensions = useMemo(() => {
    if (language === 'css') return [css()];
    if (language === 'js') return [javascript()];
    return [html()];
  }, [language]);

  return (
    <CodeMirror
      value={value}
      height={height}
      theme={oneDark}
      extensions={extensions}
      onChange={onChange}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: false,
        autocompletion: true,
        bracketMatching: true,
        tabSize: 2,
      }}
      style={{ fontSize: 12.5 }}
      aria-label={`${language} code editor`}
    />
  );
}
