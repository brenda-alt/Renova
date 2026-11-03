const ts = require('typescript');

module.exports = {
  process(source, filename) {
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2023,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
      fileName: filename,
    });

    return { code: output.outputText };
  },
};
