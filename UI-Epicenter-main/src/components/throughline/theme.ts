import type { ThemeConfig } from "antd";

/** Throughline brand tokens — Ant Design's default palette with the product's dark sider. */
export const brand = {
  primary: "#1677ff",
  primaryHover: "#4096ff",
  primaryActive: "#0958d9",
  siderBg: "#001529",
  success: "#52c41a",
  warning: "#faad14",
  error: "#ff4d4f",
  info: "#1677ff",
} as const;

const fontFamily =
  "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const baseTheme: ThemeConfig = {
  cssVar: true,
  hashed: false,
  token: {
    colorPrimary: brand.primary,
    colorSuccess: brand.success,
    colorWarning: brand.warning,
    colorError: brand.error,
    colorInfo: brand.info,
    borderRadius: 6,
    fontFamily,
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: brand.siderBg,
      triggerBg: "#002140",
      headerBg: "#ffffff",
      headerHeight: 56,
      headerPadding: "0 16px",
      bodyBg: "#f5f5f5",
    },
    Menu: {
      darkItemBg: brand.siderBg,
      darkSubMenuItemBg: "#000c17",
      darkItemSelectedBg: brand.primary,
      itemBorderRadius: 6,
    },
    Button: {
      controlHeight: 36,
    },
    Input: {
      controlHeight: 40,
    },
  },
};

export const darkOverrides: ThemeConfig = {
  components: {
    Layout: {
      headerBg: "#141414",
      bodyBg: "#000000",
    },
  },
};
