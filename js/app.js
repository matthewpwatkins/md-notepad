const FILE_MANAGER = new LocalStorageFileManager();
const MD = new window.remarkable.Remarkable("full", {
  html: true,
  xhtmlOut: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (err) {}
    }

    try {
      return hljs.highlightAuto(str).value;
    } catch (err) {}

    return ""; // use external default escaping
  },
});

const app = new Vue({
  el: "#md-notepad",
  data: {
    mounted: false,
    files: [],
    activeFile: null,
    activeFileEditor: null,
    activeFileContent: "Hi there!"
  },
  mounted() {
    this.files = FILE_MANAGER.listFiles();
    this.activeFileEditor = ace.edit(document.getElementById('editor-input'), {
      theme: "ace/theme/twilight",
      mode: "ace/mode/markdown",
      wrap: true,
      autoScrollEditorIntoView: true,
      showPrintMargin: false
    });
    this.activeFileEditor.session.on('change', this.onUpdate);
    this.mounted = true;
  },
  methods: {
    createNewFile() {
      let fileName = prompt('File name? Make it awesome :)');
      fileName = fileName ? fileName.trim() : fileName;
      if (fileName && fileName.length) {
        if (!fileName.endsWith('.md') && !fileName.endsWith('.markdown')) {
          fileName = fileName + '.md';
        }
        const fileMetadata = { name: fileName, lastEdit: { dateTime: 0 } };
        FILE_MANAGER.saveFile(fileMetadata, '');
        this.files = FILE_MANAGER.listFiles();     
        this.openFile(fileName);
      }
    },
    openFile(fileName) {
      this.activeFile = this.files.filter(f => f.name === fileName)[0];
      const value = FILE_MANAGER.readFile(this.activeFile.name);
      this.activeFileEditor.setValue(value, -1);
      this.activeFileContent = value;
    },
    onUpdate() {
      const value = this.activeFileEditor.getValue();
      this.activeFileContent = value;
      FILE_MANAGER.saveFile(this.activeFile, value);
    }
  }
});
