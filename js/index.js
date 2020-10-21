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

$(function () {
  const editor = ace.edit("editor-input", {
    theme: "ace/theme/twilight",
    mode: "ace/mode/markdown",
    wrap: true,
    autoScrollEditorIntoView: true,
    showPrintMargin: false
  });

  const render = () => {
    $('#output-html').html(MD.render(editor.getValue()).replace(/\<table\>/g, '<table class="table table-bordered table-striped">'));
  }

  editor.session.on('change', render);

  // Bind the file menu options
  $(".btn-file-open").click(function () {
    const fileSelector = $("#" + $(this).attr("file-input-target"));
    fileSelector.click();
  });

  $(".btn-file-save").click(function () {
    const code = editor.getValue();
    const fileName = $(this).attr("file-name");
    download(code, fileName, "text/plain");
  });

  // Handle file uploads
  $(".hidden-file-selector").change(function (changeEvent) {
    const selectedFile = changeEvent.target.files[0];
    const fileReader = new FileReader();
    fileReader.addEventListener("load", loadEvent => {
      editor.setValue(loadEvent.target.result, -1);
    });
    fileReader.readAsText(selectedFile);
  });

  render();
});