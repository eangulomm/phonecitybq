import { siteConfig } from '../data/siteConfig';
import { fetchFromAppsScript } from './apiClient';

const brandConfig = {
  name: siteConfig.name,
  tagline: siteConfig.tagline,
  logoText: siteConfig.logoText,
  logoImage: siteConfig.logoImage,
  url: siteConfig.url,
  whatsapp: siteConfig.whatsapp,
  phoneDisplay: siteConfig.phoneDisplay,
  email: siteConfig.email,
  address: siteConfig.address,
  colors: siteConfig.colors,
  social: siteConfig.social,
  nav: siteConfig.nav,
  hero: siteConfig.hero,
  banners: siteConfig.banners,
  benefits: siteConfig.benefits,
  paymentMethods: siteConfig.paymentMethods,
  brands: siteConfig.brands,
  testimonials: siteConfig.testimonials,
  faq: siteConfig.faq,
};

export async function getSiteConfig() {
  const remoteConfig = await fetchFromAppsScript('siteConfig');
  return {
    ...siteConfig,
    ...(remoteConfig?.data || remoteConfig || {}),
    ...brandConfig,
  };
}
