import { locale } from './i18n'

export type OperatingSystem = 'macos' | 'windows' | 'linux'

type Guide = {
  label: string
  title: string
  description: string
  steps: string[]
  sourceLabel: string
  sourceUrl: string
}

type Documentation = {
  eyebrow: string
  title: string
  intro: string
  prerequisitesTitle: string
  prerequisites: string[]
  troubleshootingTitle: string
  troubleshooting: string
  guides: Record<OperatingSystem, Guide>
}

const documentation: Record<'de' | 'en', Documentation> = {
  de: {
    eyebrow: 'LOKALES NETZWERK',
    title: 'Spieler verbinden',
    intro: 'Richte ein gemeinsames WLAN ein. Eine Internetverbindung ist dafür nicht erforderlich.',
    prerequisitesTitle: 'Vor dem Start',
    prerequisites: [
      'Starte Tourny im lokalen Master-Modus auf dem Turnier-Laptop.',
      'Verbinde alle Geräte mit demselben WLAN.',
      'Scanne anschließend den Zuschauer-QR-Code auf diesem Laptop.',
    ],
    troubleshootingTitle: 'Wenn die Ansicht nicht lädt',
    troubleshooting:
      'Prüfe, ob alle Geräte im selben WLAN sind, die Client-Isolation des Hotspots deaktiviert ist und die Firewall den lokalen Tourny-Port zulässt.',
    guides: {
      macos: {
        label: 'macOS',
        title: 'WLAN auf dem Mac freigeben',
        description:
          'Am zuverlässigsten teilst du eine Ethernet- oder andere vorhandene Verbindung über WLAN.',
        steps: [
          'Öffne  > Systemeinstellungen > Allgemein > Freigaben.',
          'Aktiviere „Internetfreigabe“ und wähle „Konfigurieren“.',
          'Wähle die Verbindung aus, die geteilt werden soll, und aktiviere darunter WLAN.',
          'Vergib Netzwerkname und Passwort, speichere und schalte die Internetfreigabe ein.',
        ],
        sourceLabel: 'Apple Support: Internetfreigabe auf dem Mac',
        sourceUrl: 'https://support.apple.com/en-euro/guide/mac-help/-mchlp1540/mac',
      },
      windows: {
        label: 'Windows',
        title: 'Mobilen Hotspot unter Windows einrichten',
        description:
          'Windows 11 und 10 können einen WLAN-Hotspot direkt in den Einstellungen erstellen.',
        steps: [
          'Öffne Einstellungen > Netzwerk und Internet > Mobiler Hotspot.',
          'Wähle bei „Freigeben über“ WLAN und bei Bedarf die Quellverbindung.',
          'Bearbeite Netzwerkname und Passwort.',
          'Schalte „Meine Internetverbindung für andere Geräte freigeben“ ein.',
        ],
        sourceLabel: 'Microsoft Support: Mobiler Hotspot',
        sourceUrl:
          'https://support.microsoft.com/en-us/windows/experience/connectivity-networking/use-your-windows-device-as-a-mobile-hotspot',
      },
      linux: {
        label: 'Linux',
        title: 'WLAN-Hotspot unter Linux einrichten',
        description:
          'Auf Ubuntu und vielen GNOME-/NetworkManager-Desktops liegt die Funktion direkt im WLAN-Menü.',
        steps: [
          'Öffne das Systemmenü und erweitere den Bereich WLAN.',
          'Wähle „Alle Netzwerke“ und anschließend im Menü „WLAN-Hotspot aktivieren“.',
          'Bestätige, dass die bestehende WLAN-Verbindung getrennt wird, falls danach gefragt wird.',
          'Notiere SSID und Sicherheitsschlüssel und verbinde die Zuschauergeräte damit.',
        ],
        sourceLabel: 'Ubuntu-Dokumentation: WLAN-Hotspot erstellen',
        sourceUrl: 'https://help.ubuntu.com/stable/ubuntu-help/net-wireless-adhoc.html.en',
      },
    },
  },
  en: {
    eyebrow: 'LOCAL NETWORK',
    title: 'Connect players',
    intro: 'Create a shared Wi-Fi network. An internet connection is not required.',
    prerequisitesTitle: 'Before you start',
    prerequisites: [
      'Start Tourny in local master mode on the tournament laptop.',
      'Connect every device to the same Wi-Fi network.',
      'Then scan the viewer QR code on this laptop.',
    ],
    troubleshootingTitle: 'If the view does not load',
    troubleshooting:
      'Check that every device uses the same Wi-Fi, hotspot client isolation is disabled, and the firewall allows Tourny’s local port.',
    guides: {
      macos: {
        label: 'macOS',
        title: 'Share Wi-Fi from a Mac',
        description:
          'The most reliable setup shares an Ethernet or other existing connection over Wi-Fi.',
        steps: [
          'Open  > System Settings > General > Sharing.',
          'Enable Internet Sharing and select Configure.',
          'Choose the connection to share and select Wi-Fi below it.',
          'Set a network name and password, save, then turn on Internet Sharing.',
        ],
        sourceLabel: 'Apple Support: Share the Internet connection on Mac',
        sourceUrl: 'https://support.apple.com/en-euro/guide/mac-help/-mchlp1540/mac',
      },
      windows: {
        label: 'Windows',
        title: 'Set up a Windows mobile hotspot',
        description: 'Windows 11 and 10 can create a Wi-Fi hotspot directly from Settings.',
        steps: [
          'Open Settings > Network & internet > Mobile hotspot.',
          'Choose Wi-Fi under Share over and select the source connection if needed.',
          'Edit the network name and password.',
          'Turn on Share my internet connection with other devices.',
        ],
        sourceLabel: 'Microsoft Support: Mobile hotspot',
        sourceUrl:
          'https://support.microsoft.com/en-us/windows/experience/connectivity-networking/use-your-windows-device-as-a-mobile-hotspot',
      },
      linux: {
        label: 'Linux',
        title: 'Set up a Linux Wi-Fi hotspot',
        description:
          'On Ubuntu and many GNOME/NetworkManager desktops, the feature lives directly in the Wi-Fi menu.',
        steps: [
          'Open the system menu and expand the Wi-Fi section.',
          'Choose All Networks, then select Turn On Wi-Fi Hotspot from the menu.',
          'Confirm that the current Wi-Fi connection will disconnect when prompted.',
          'Note the SSID and security key, then connect the viewer devices.',
        ],
        sourceLabel: 'Ubuntu Documentation: Create a wireless hotspot',
        sourceUrl: 'https://help.ubuntu.com/stable/ubuntu-help/net-wireless-adhoc.html.en',
      },
    },
  },
}

export const detectOperatingSystem = (): OperatingSystem => {
  const platform = `${navigator.userAgent} ${navigator.platform}`.toLowerCase()
  if (platform.includes('win')) return 'windows'
  if (platform.includes('linux')) return 'linux'
  return 'macos'
}

export const getNetworkDocumentation = () => documentation[locale]
