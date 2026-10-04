// @ts-ignore
import * as WaveDrom from 'wavedrom'
import type { CodeMirrorStringStream } from 'typora'
import { CodeblockPostProcessor, html, Plugin } from '@typora-community-plugin/core'


const prefix = 'WaveDrom_Display_'

export default class extends Plugin {

  index = 0

  onload() {
    // @ts-ignore
    window.WaveSkin = WaveDrom.waveSkin

    this.register(
      this.app.features.markdownEditor.codeblock.registerMode({
        lang: 'wavedrom',
        mode: () => ({
          name: 'wavedrom',
          lineComment: '//',
          blockComment: ['/*', '*/'],
          startState: () => ({ comment: false, string: null }),
          token(stream: CodeMirrorStringStream, state: { comment: boolean, string: string | null }) {
            if (state.comment) {
              if (!stream.skipTo('*/')) {
                stream.skipToEnd()
              } else {
                stream.match('*/')
                state.comment = false
              }
              return 'comment'
            }

            if (state.string) {
              while (!stream.eol()) {
                const ch = stream.next()
                if (ch === '\\') stream.next()
                else if (ch === state.string) { state.string = null; break }
              }
              return 'string'
            }

            if (stream.eatSpace()) return null

            if (stream.match('//')) {
              stream.skipToEnd()
              return 'comment'
            }
            if (stream.match('/*')) {
              state.comment = true
              if (!stream.skipTo('*/')) {
                stream.skipToEnd()
              } else {
                stream.match('*/')
                state.comment = false
              }
              return 'comment'
            }

            const quote = stream.peek()
            if (quote === '"' || quote === "'") {
              state.string = quote
              stream.next()
              while (!stream.eol()) {
                const ch = stream.next()
                if (ch === '\\') stream.next()
                else if (ch === quote) { state.string = null; break }
              }
              return 'string'
            }

            if (stream.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)) return 'number'
            if (stream.match(/^(?:true|false|null)\b/)) return 'atom'

            if (stream.match(/^[A-Za-z_$][\w$]*/))
              return stream.match(/^\s*:/, false) ? 'property' : 'variable'

            if (stream.match(/^[{}[\]]/)) return 'bracket'
            if (stream.match(/^[,:]/)) return 'punctuation'
            if (stream.match(/^[+\-*/%<>=!&|?~^]+/)) return 'operator'

            stream.next()
            return null
          },
        }),
      })
    )

    this.register(
      this.app.features.markdownEditor.postProcessor.register(
        CodeblockPostProcessor.from({
          lang: ['wavedrom'],
          exportPreview: true,
          preview: (code, pre) => {
            const index = pre.getAttribute('data-wavedrom-i')
              ?? (++this.index).toString()

            pre.setAttribute('data-wavedrom-i', index)

            let signal = { signal: [] }
            try {
              signal = new Function(`return ${code}`)()
            } catch (error) {
              return html`<div style="color: red;">${error}</div>`
            }

            setTimeout(() => {
              $('.md-diagram-panel-preview', pre).attr('id', prefix + index)
              WaveDrom.renderWaveForm(index, signal, prefix, false)
            })

            return '' as any
          }
        })))
  }

  onunload() {
    // @ts-ignore
    delete window.WaveSkin
  }
}
