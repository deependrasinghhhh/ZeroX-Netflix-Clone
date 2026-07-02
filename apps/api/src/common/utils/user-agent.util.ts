export interface UserAgentDetails {
  browser: string;
  os: string;
}

export function parseUserAgent(userAgentString: string | undefined): UserAgentDetails {
  if (!userAgentString) {
    return { browser: "Unknown Browser", os: "Unknown OS" };
  }

  // Parse OS
  let os = "Unknown OS";
  if (/Windows/i.test(userAgentString)) {
    os = "Windows";
  } else if (/Macintosh|Mac OS X/i.test(userAgentString)) {
    os = "macOS";
  } else if (/iPhone|iPad|iPod/i.test(userAgentString)) {
    os = "iOS";
  } else if (/Android/i.test(userAgentString)) {
    os = "Android";
  } else if (/Linux/i.test(userAgentString)) {
    os = "Linux";
  }

  // Parse Browser
  let browser = "Unknown Browser";
  if (/Edg|Edge/i.test(userAgentString)) {
    browser = "Edge";
  } else if (/Chrome|CriOS/i.test(userAgentString)) {
    // Chrome matches Safari as well, so check Chrome first
    browser = "Chrome";
  } else if (/Firefox|FxiOS/i.test(userAgentString)) {
    browser = "Firefox";
  } else if (/Safari/i.test(userAgentString)) {
    browser = "Safari";
  } else if (/MSIE|Trident/i.test(userAgentString)) {
    browser = "Internet Explorer";
  }

  return { browser, os };
}
