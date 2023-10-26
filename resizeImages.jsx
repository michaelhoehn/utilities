// Define our aspect ratios
var aspectRatios = {
  A: { width: 4, height: 5 },
  B: { width: 5, height: 4 },
  C: { width: 1, height: 1.41 },
  // D: { width: 1.41, height: 1 },
  // E: { width: 3, height: 4 },
  // F: { width: 4, height: 3 },
  // G: { width: 2, height: 3 },
  // H: { width: 3, height: 2 },
  // I: { width: 4, height: 5.091 },
  // J: { width: 5.091, height: 4 },
  // K: { width: 1, height: 1 },
};

function resizeCanvasToAspectRatio(doc, aspectRatio) {
  var currentWidth = doc.width;
  var currentHeight = doc.height;

  var targetWidth = currentHeight * (aspectRatio.width / aspectRatio.height);
  var targetHeight = currentWidth * (aspectRatio.height / aspectRatio.width);

  var newWidth = Math.max(currentWidth, targetWidth);
  var newHeight = Math.max(currentHeight, targetHeight);

  doc.resizeCanvas(newWidth, newHeight, AnchorPosition.MIDDLECENTER);

  // Fill with white background
  fillWithWhiteBackground(doc);
}

function fillWithWhiteBackground(doc) {
  // Set the white background color
  var backgroundColor = new SolidColor();
  backgroundColor.rgb.red = 255;
  backgroundColor.rgb.green = 255;
  backgroundColor.rgb.blue = 255;

  // Store the current layer
  var currentLayer = doc.activeLayer;

  // Create a new layer at the bottom of the layer stack
  var backgroundLayer = doc.artLayers.add();
  doc.activeLayer = backgroundLayer;
  backgroundLayer.move(currentLayer, ElementPlacement.PLACEAFTER);

  // Set the background color and fill the new layer
  app.backgroundColor = backgroundColor;
  doc.selection.selectAll();
  doc.selection.fill(app.backgroundColor);
  doc.selection.deselect();

  // Restore the original layer as active
  doc.activeLayer = currentLayer;
}

function createFolderForImage(imageName, parentFolder) {
  // Remove the file extension from the image name to create the folder name
  var folderName = imageName.split(".")[0];
  var newFolder = new Folder(parentFolder + "/" + folderName);

  // Check if the folder exists. If not, create it
  if (!newFolder.exists) {
    newFolder.create();
  }

  return newFolder;
}

function saveImageWithNewName(doc, letter, folder) {
  var originalName = doc.name.split(".")[0];
  var ext = doc.name.split(".")[1];
  var newName = originalName + "_" + letter + "." + ext;

  var file = new File(folder + "/" + newName);

  var options;
  if (ext.toLowerCase() === "png") {
    options = new PNGSaveOptions();
  } else if (ext.toLowerCase() === "jpg") {
    options = new JPEGSaveOptions();
    options.quality = 12;
  } // ... Add other formats if needed

  doc.saveAs(file, options, true);
}

function processImages() {
  var folder = Folder.selectDialog("Choose a folder");
  if (folder !== null) {
    var files = folder.getFiles(function (file) {
      return file instanceof File && file.name.match(/\.(jpg|png)$/i);
    });

    for (var i = 0; i < files.length; i++) {
      var outputFolder = createFolderForImage(files[i].name, folder);
      for (var key in aspectRatios) {
        var doc = app.open(files[i]);
        ensureLayerIsUnlocked(doc);
        resizeCanvasToAspectRatio(doc, aspectRatios[key]);
        fillWithWhiteBackground(doc);
        saveImageWithNewName(doc, key, outputFolder);

        doc.close(SaveOptions.DONOTSAVECHANGES);
      }
    }
  }
}

function ensureLayerIsUnlocked(doc) {
  var layer = doc.activeLayer;

  // If the layer is a background layer, make it a regular layer
  if (layer.isBackgroundLayer) {
    layer.isBackgroundLayer = false;
  }
}

processImages();
