import type App from '../app/index.js'
import { TabChange } from '../app/messages.gen.js'

export default function (app: App): void {
  function changeTab() {
    if (!document.hidden) {
      app.debug.log('Sonarly: tab change to' + app.session.getTabId())
      app.send(TabChange(app.session.getTabId()))
    }
  }

  app.attachEventListener(window, 'focus', changeTab as EventListener, false, false)
}
