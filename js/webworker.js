self.languagePluginUrl = 'https://pyodide-cdn2.iodide.io/v0.15.0/full/'
importScripts('https://pyodide-cdn2.iodide.io/v0.15.0/full/pyodide.js')

var onmessage = function (e) { // eslint-disable-line no-unused-vars
  languagePluginLoader.then(() => {

    var logger = new Object();
    logger.print = function (message) {
      self.postMessage({ message: message });
    }
    self['logger'] = logger
    //STD IO setup, so that we can capture stdout and stderr from the main thread's javascript.
    self.pyodide.runPythonAsync(
      'from js import logger\n' +
      'class stdWrapper():\n' +
      '    def __init__(self, stream):\n' +
      '        self.stream = stream\n' +
      '    def write(self,text):\n' +
      '        logger.print(text)\n' +
      '        self.stream.write(text)\n' + 
      'sys.stdout = stdWrapper(sys.__stdout__)\n' +
      'sys.stderr = stdWrapper(sys.__stderr__)\n').then(() => {
        const data = e.data;
        const keys = Object.keys(data);
        for (let key of keys) {
          if (key !== 'python') {
            // Keys other than python must be arguments for the python script.
            // Set them on self, so that `from js import key` works (in python).
            self[key] = data[key];
          }
        }

        self.pyodide.runPythonAsync(data.python, () => { })
          .then((results) => { self.postMessage({ results }); })
          .catch((err) => {
            self.postMessage({ error: err.message });
          });
      });
  });
}
