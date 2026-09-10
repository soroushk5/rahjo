export const runtimeConfigPattern = /(<script id="rahjo-runtime-config" type="application\/json">)[\s\S]*?(<\/script>)/;

/** @param {{mode:string, apiBase:string, buildSha:string}} config */
export function injectRuntimeMetadata(index, config) {
  if (!runtimeConfigPattern.test(index)) throw new Error('Runtime configuration marker is missing from index.html');
  const serialized = JSON.stringify(config).replace(/</g, '\\u003c');
  return index.replace(runtimeConfigPattern, `$1${serialized}$2`);
}

/** @param {{mode:string, apiBase:string, buildSha:string}} config */
export function runtimeHealthFields(config) {
  return {
    runtimeMode: config.mode,
    apiBase: config.apiBase,
    buildSha: config.buildSha
  };
}
