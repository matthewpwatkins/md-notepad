const TAB_SIZE = 2;

const DEFAULT_OBJ = {
  lastName: "Doe",
  householdMembers: [
    {
      name: "John",
      isHead: true,
      age: 30,
    },
    {
      name: "Jack",
      age: 4,
    },
    {
      name: "Jill",
      age: 2,
    },
    {
      name: "Jane",
      isHead: true,
      age: 28,
    },
  ],
};

function transform(obj) {
  // Return full names of household members with their roles
  // Parents are returned before children
  return obj.householdMembers
    .sort(m => (m.isHead ? -1 : 1))
    .map(m => {
      const type = m.isHead ? "parent" : "child";
      return `${m.name} ${obj.lastName} (${type})`;
    });
}

function getFunctionBody(fn) {
  try {
    const fnString = fn.toString();
    const functionBodyString = fnString.slice(fnString.indexOf("{") + 1, fnString.lastIndexOf("}"));
    let skipChars = 0;
    for (let i = 0; i < functionBodyString.length; i++) {
      const c = functionBodyString.charAt(i);
      if (c !== "\r" && c !== "\n") {
        break;
      }
      skipChars++;
    }
    return functionBodyString.substring(skipChars);
  } catch (err) {
    throw "Could not read function body. " + err;
  }
}

function getInputEditor() {
  return EDITORS_BY_ID["editor-input"];
}

function getInputObjectFromEditor() {
  const inputText = getInputEditor().getValue();
  if (!inputText) {
    throw "No input JSON specified";
  }

  try {
    const inputObject = JSON.parse(inputText);
    if (!inputObject) {
      throw "the object result was " + inputObject;
    }
    return inputObject;
  } catch (err) {
    throw "Could not parse input as JSON: " + err;
  }
}

function getTransformEditor() {
  return EDITORS_BY_ID["editor-transform"];
}

function getOutputEditor() {
  return EDITORS_BY_ID["editor-output"];
}

function getConsoleEditor() {
  return EDITORS_BY_ID["editor-console"];
}

function logToConsoleEditor(line) {
  const consoleEditor = getConsoleEditor();
  const existingLines = consoleEditor.session.getLength();
  const prepend = existingLines > 1 || consoleEditor.getValue().trim().length > 0 ? "\n" : "";
  const dateString = new Date().toISOString().substring(0, 19).replace("T", " ");
  consoleEditor.session.insert(
    {
      row: consoleEditor.session.getLength(),
      column: 0,
    },
    `${prepend}${dateString}:  ${line}`
  );
  consoleEditor.scrollToLine(existingLines + 1, false, false);
}

function clearEditor(editor) {
  editor.setValue("", -1);
}

const DEFAULT_TRANSFORM_FUNCTION_BODY_STRING = transform.toString();
const EDITORS_BY_ID = {};

$(function () {
  // Render the editors
  let editorsBeingRendered = 0;
  for (const editorElement of $(".ace-editor")) {
    const editorSelectorElement = $(editorElement);
    const isReadOnlyValue = editorSelectorElement.attr("ace-read-only");
    const isReadOnly = typeof isReadOnlyValue !== typeof undefined && isReadOnlyValue !== false;
    const minLines = parseInt(editorSelectorElement.attr("ace-min-lines"));
    const maxLines = parseInt(editorSelectorElement.attr("ace-max-lines"));
    const editorID = editorSelectorElement.attr("id");

    editorsBeingRendered++;
    const editor = ace.edit(editorElement, {
      theme: "ace/theme/twilight",
      mode: "ace/mode/" + editorSelectorElement.attr("ace-language"),
      minLines: minLines,
      maxLines: maxLines,
      wrap: true,
      autoScrollEditorIntoView: true,
      readOnly: isReadOnly,
      showPrintMargin: false,
      tabSize: TAB_SIZE,
    });

    EDITORS_BY_ID[editorID] = editor;

    editor.renderer.on("afterRender", function () {
      setTimeout(function () {
        editorSelectorElement.removeClass("invisible");
        editorsBeingRendered--;
        if (editorsBeingRendered <= 0) {
          hideSpinner();
        }
      }, 400);
    });
  }

  // Bind the file menu options
  $(".btn-file-open").click(function () {
    const fileSelector = $("#" + $(this).attr("file-input-target"));
    fileSelector.click();
  });

  $(".btn-file-save").click(function () {
    const editor = EDITORS_BY_ID[$(this).attr("editor-target")];
    const code = editor.getValue();
    const fileName = $(this).attr("file-name");
    download(code, fileName, "text/plain");
    logToConsoleEditor("Downloading " + fileName);
    if (window.chrome) {
      $("#chrome-download-modal").modal();
    }
  });

  // Handle file uploads
  $(".hidden-file-selector").change(function (changeEvent) {
    showSpinner();
    const selectedFile = changeEvent.target.files[0];
    const targetEditor = EDITORS_BY_ID[$(this).attr("editor-target")];
    const fileReader = new FileReader();
    fileReader.addEventListener("load", loadEvent => {
      targetEditor.setValue(loadEvent.target.result, -1);
      logToConsoleEditor(`Loaded ${selectedFile.name}`);
      hideSpinner();
    });
    fileReader.readAsText(selectedFile);
  });

  // Populate default values
  getInputEditor().setValue(JSON.stringify(DEFAULT_OBJ, null, TAB_SIZE), -1);
  getTransformEditor().setValue(DEFAULT_TRANSFORM_FUNCTION_BODY_STRING, -1);

  const performTransform = () => {
    showSpinner();
    let operation;
    try {
      operation = "reading input object json";
      const inputObject = getInputObjectFromEditor();

      operation = "parsing transform function";
      const transformFunctionText = getTransformEditor().getValue();
      if (!transformFunctionText) {
        throw "No transform JS specified";
      }

      operation = "building transform function";
      const transformFunction = new Function("obj", getFunctionBody(transformFunctionText));

      operation = "transforming the input object";
      const resultObject = transformFunction(inputObject);
      if (!resultObject) {
        throw "The result transformed object was " + resultObject;
      }

      operation = "serializing the input object";
      const resultObjectJSON = JSON.stringify(resultObject, null, TAB_SIZE) || "";
      getOutputEditor().setValue(resultObjectJSON, -1);
      logToConsoleEditor("Transformed successfully");
    } catch (err) {
      console.error(operation, err);
      clearEditor(getOutputEditor());
      logToConsoleEditor(`ERROR ${operation}: ${err}`);
    }
    hideSpinner();
  };

  performTransform();

  $("#btn-transform").click(performTransform);

  $("#btn-pretty").click(function () {
    showSpinner();
    try {
      const inputObject = getInputObjectFromEditor();
      getInputEditor().setValue(JSON.stringify(inputObject, null, TAB_SIZE), -1);
      logToConsoleEditor("Prettified");
    } catch (err) {
      logToConsoleEditor("Error prettifying JSON: " + err);
    }
    hideSpinner();
  });

  $("#btn-console-clear").click(function () {
    clearEditor(getConsoleEditor());
  });
});
