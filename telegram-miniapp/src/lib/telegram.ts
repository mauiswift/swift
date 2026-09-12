// Telegram Web App API wrapper
interface TelegramWebAppType {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
      is_premium?: boolean
      added_to_attachment_menu?: boolean
      allows_write_to_pm?: boolean
    }
    auth_date: number
    hash: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  isClosingConfirmationEnabled: boolean
  HeaderColor: string
  BackgroundColor: string
  BottomBarColor?: string
  isVerticalSwipesEnabled: boolean
  isContentExpanded: boolean
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  isIframe: boolean

  ready(): void
  expand(): void
  close(): void
  showPopup(params: any, callback?: (id: string) => void): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  sendData(data: string): void
  switchInlineQuery(query: string, choose_chat_types?: string[]): void
  openLink(url: string, options?: { try_instant_view?: boolean }): void
  openTelegramLink(url: string): void
  openInvoice(url: string, callback?: (status: string) => void): void
  shareToStory(media_url: string, options?: { text?: string; widget_link?: any }): void
  shareURL(url: string, text?: string, callback?: () => void): void
  requestPhone(callback?: (shared: boolean) => void): void
  requestContact(callback?: (shared: boolean) => void): void
  requestWriteAccess(callback?: (granted: boolean) => void): void
  requestLocationAccess(callback?: (granted: boolean) => void): void
  readTextFromClipboard(callback?: (text: string | null) => void): void

  MainButton?: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText(text: string): void
    onClick(callback: () => void): void
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
    setParams(params: {
      text?: string
      color?: string
      text_color?: string
      is_active?: boolean
      is_visible?: boolean
    }): void
  }

  BackButton?: {
    isVisible: boolean
    onClick(callback: () => void): void
    show(): void
    hide(): void
  }

  SettingsButton?: {
    isVisible: boolean
    onClick(callback: () => void): void
    show(): void
    hide(): void
  }

  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }

  CloudStorage?: {
    getItem(key: string, callback?: (error: any, value: string) => void): void
    setItem(key: string, value: string, callback?: (error: any) => void): void
    removeItem(key: string, callback?: (error: any) => void): void
    getKeys(callback?: (error: any, keys: string[]) => void): void
  }

  BiometricManager?: {
    isInited: boolean
    isBiometricAvailable: boolean
    biometricType: 'finger' | 'face' | 'unknown'
    isAccessRequested: boolean
    isAccessGranted: boolean
    isBiometricTokenSaved: boolean
    init(callback?: () => void): void
    requestAccess(params: { reason?: string }, callback?: (granted: boolean) => void): void
    authenticate(params: { reason?: string }, callback?: (authenticated: boolean) => void): void
    updateBiometricToken(token: string, callback?: (updated: boolean) => void): void
  }

  onEvent(eventType: string, callback: (...args: any[]) => void): void
  offEvent(eventType: string, callback: (...args: any[]) => void): void
}

interface TelegramWebAppGlobal {
  TelegramWebApp?: TelegramWebAppType
}

class TelegramWebAppHelper {
  private tg: TelegramWebAppType | undefined

  constructor() {
    const global = window as unknown as TelegramWebAppGlobal
    this.tg = global.TelegramWebApp
  }

  init(): void {
    if (this.tg) {
      this.tg.ready()
    }
  }

  get user() {
    return this.tg?.initDataUnsafe?.user
  }

  get userId() {
    return this.tg?.initDataUnsafe?.user?.id
  }

  get initData() {
    return this.tg?.initData || ''
  }

  get platform() {
    return this.tg?.platform || 'unknown'
  }

  get colorScheme() {
    return this.tg?.colorScheme || 'dark'
  }

  get themeParams() {
    return this.tg?.themeParams || {}
  }

  get MainButton() {
    return this.tg?.MainButton
  }

  get BackButton() {
    return this.tg?.BackButton
  }

  get HapticFeedback() {
    return this.tg?.HapticFeedback
  }

  get CloudStorage() {
    return this.tg?.CloudStorage
  }

  showPopup(params: any, callback?: (id: string) => void): void {
    this.tg?.showPopup(params, callback)
  }

  showAlert(message: string, callback?: () => void): void {
    this.tg?.showAlert(message, callback)
  }

  showConfirm(message: string, callback?: (confirmed: boolean) => void): void {
    this.tg?.showConfirm(message, callback)
  }

  openLink(url: string, options?: { try_instant_view?: boolean }): void {
    this.tg?.openLink(url, options)
  }

  openTelegramLink(url: string): void {
    this.tg?.openTelegramLink(url)
  }

  sendData(data: string): void {
    this.tg?.sendData(data)
  }

  expand(): void {
    this.tg?.expand()
  }

  close(): void {
    this.tg?.close()
  }

  requestWriteAccess(callback?: (granted: boolean) => void): void {
    this.tg?.requestWriteAccess(callback)
  }

  requestContact(callback?: (shared: boolean) => void): void {
    this.tg?.requestContact(callback)
  }
}

const TelegramWebApp = new TelegramWebAppHelper()

export default TelegramWebApp
