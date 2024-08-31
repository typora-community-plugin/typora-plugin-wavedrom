// @ts-ignore
import * as WaveDrom from 'wavedrom'
import { CodeblockPostProcessor, html, Plugin } from '@typora-community-plugin/core'


const prefix = 'WaveDrom_Display_'

export default class extends Plugin {

  index = 0

  onload() {
    // @ts-ignore
    window.WaveSkin = WaveDrom.waveSkin

    this.registerMarkdownPostProcessor(
      CodeblockPostProcessor.from({
        lang: ['wavedrom'],
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
      }))
  }

  onunload() {
    // @ts-ignore
    delete window.WaveSkin
  }
}
