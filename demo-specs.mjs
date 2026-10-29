export const images = {node24: 'beerjs-node24:local', node26: 'beerjs-node26:local', deno: 'beerjs-deno:local'};
export const specs = {
  4: [['node24','node','read-secret.mjs'], ['node26','node','--permission','--allow-fs-read=./read-secret.mjs','read-secret.mjs'], ['deno','deno','run','--no-prompt','read-secret.mjs']],
  5: [['node24','node','env-secret.mjs'], ['node26','node','--permission','--allow-fs-read=./env-secret.mjs','env-secret.mjs'], ['deno','deno','run','--no-prompt','env-secret.mjs']],
  6: [['node24','node','network-demo.mjs','node','--permission','--allow-fs-read=./outbound.mjs','outbound.mjs'], ['node26','node','network-demo.mjs','node','--permission','--allow-fs-read=./outbound.mjs','outbound.mjs'], ['deno','deno','run','--no-prompt','--allow-all','network-demo.mjs','deno','run','--no-prompt','outbound.mjs']],
  7: [['node24','node','spawn.mjs'], ['node26','node','--permission','--allow-fs-read=./spawn.mjs','spawn.mjs'], ['deno','deno','run','--no-prompt','spawn.mjs']],
  9: [['node24','node','install-demo.mjs','npm'], ['node26','node','install-demo.mjs','npm'], ['deno','deno','run','--no-prompt','--allow-all','install-demo.mjs','deno']],
  11: [['node24','node','typecheck.ts'], ['node26','node','typecheck.ts'], ['deno','deno','check','--no-remote','typecheck.ts']]
};

// Expected denials are valid demonstrations; infrastructure failures are not.
export function validateResult(demo, variant, result) {
  if (!specs[demo]?.[variant]) return {ok: false, reason: 'Demo desconocida'};
  if (result.error || result.timedOut || !Number.isInteger(result.exitCode)) {
    return {ok: false, reason: result.error || 'Ejecución incompleta'};
  }
  const text = (result.stdout || '') + '\n' + (result.stderr || '');
  let expectedExit = 0;
  let pattern;
  if (demo === 4) {
    expectedExit = variant === 0 ? 0 : 1;
    pattern = variant === 0 ? /DEMO_TOKEN_123/ : variant === 1 ? /ERR_ACCESS_DENIED[\s\S]*secret\.txt/ : /(?:NotCapable|Requires read access)[\s\S]*secret\.txt/i;
  } else if (demo === 5) {
    expectedExit = variant === 2 ? 1 : 0;
    pattern = variant === 2 ? /(?:NotCapable|Requires env access)[\s\S]*DEMO_SECRET/i : /SECRET: DEMO_TOKEN_123/;
  } else if (demo === 6) {
    expectedExit = variant === 0 ? 0 : 1;
    pattern = variant === 0 ? /OUTBOUND RESULT: PONG/ : variant === 1 ? /ERR_ACCESS_DENIED[\s\S]*Network|Network[\s\S]*ERR_ACCESS_DENIED/i : /(?:NotCapable|Requires net access)[\s\S]*127\.0\.0\.1/i;
  } else if (demo === 7) {
    expectedExit = variant === 0 ? 0 : 1;
    pattern = variant === 0 ? /child OK/ : variant === 1 ? /ERR_ACCESS_DENIED[\s\S]*ChildProcess/i : /(?:NotCapable|Requires run access)/i;
  } else if (demo === 9) {
    pattern = variant === 0
      ? /INSTALL_EXIT=0[\s\S]*PREINSTALL=executed[\s\S]*POSTINSTALL=executed/
      : /INSTALL_EXIT=0[\s\S]*PREINSTALL=not executed[\s\S]*POSTINSTALL=not executed/;
  } else {
    expectedExit = 1;
    pattern = variant === 2 ? /TS2345/ : /TypeError[\s\S]*toUpperCase/;
  }
  const ok = result.exitCode === expectedExit && pattern.test(text);
  return {ok, reason: ok ? 'Resultado esperado verificado' : `Salida inesperada: se esperaba exit=${expectedExit} y evidencia específica de esta demo`};
}
