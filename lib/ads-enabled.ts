/**
 * Master switch for every ad and sponsor placement. Off unless the deployment
 * sets NEXT_PUBLIC_ADS_ENABLED=true; it is inlined at build time, so changing
 * it takes a redeploy.
 */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
