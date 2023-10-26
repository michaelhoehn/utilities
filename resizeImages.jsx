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

function getImageType() {
  var result = prompt(
    "Is the image a white background or full bleed?\n\nEnter 'white' for white background or 'bleed' for full bleed:",
    "white"
  );

  // If user cancels or enters something other than the two options, default to white.
  if (result !== "white" && result !== "bleed") {
    result = "white";
  }

  return result;
}

function resizeCanvasToAspectRatio(doc, aspectRatio, imageType) {
  var currentWidth = doc.width;
  var currentHeight = doc.height;
  var targetWidth, targetHeight;

  if (imageType === "white") {
    var desiredAspectRatio = aspectRatio.width / aspectRatio.height;
    var currentAspectRatio = currentWidth / currentHeight;

    if (currentAspectRatio > desiredAspectRatio) {
      // Current image is wider than desired. Keep the width, adjust the height.
      targetWidth = currentWidth;
      targetHeight = currentWidth / desiredAspectRatio;
    } else {
      // Current image is taller than desired. Keep the height, adjust the width.
      targetWidth = currentHeight * desiredAspectRatio;
      targetHeight = currentHeight;
    }

    doc.resizeCanvas(targetWidth, targetHeight, AnchorPosition.MIDDLECENTER);
  } else {
    // Full bleed
    var desiredAspectRatio = aspectRatio.width / aspectRatio.height;
    var currentAspectRatio = currentWidth / currentHeight;

    if (currentAspectRatio > desiredAspectRatio) {
      // The image is wider than desired, adjust width
      targetWidth = currentHeight * desiredAspectRatio;
      targetHeight = currentHeight;
    } else {
      // The image is taller than desired, adjust height
      targetWidth = currentWidth;
      targetHeight = currentWidth / desiredAspectRatio;
    }

    var x = (currentWidth - targetWidth) / 2;
    var y = (currentHeight - targetHeight) / 2;

    var bounds = [x, y, x + targetWidth, y + targetHeight];
    doc.crop(bounds);
  }
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
      var doc = app.open(files[i]);

      ensureLayerIsUnlocked(doc); // Ensure the layer is unlocked

      // Define the output folder for each image
      var outputFolder = new Folder(
        files[i].parent + "/" + files[i].name.split(".")[0]
      );
      if (!outputFolder.exists) {
        outputFolder.create();
      }

      var imageType = getImageType(); // Get the user's input once per image

      for (var key in aspectRatios) {
        resizeCanvasToAspectRatio(doc, aspectRatios[key], imageType);
        fillWithWhiteBackground(doc);
        saveImageWithNewName(doc, key, outputFolder);

        doc.close(SaveOptions.DONOTSAVECHANGES);
        doc = app.open(files[i]); // Reopen the image for the next aspect ratio

        ensureLayerIsUnlocked(doc); // Ensure the layer is unlocked again after reloading
      }

      doc.close(SaveOptions.DONOTSAVECHANGES); // Close the document fully after processing all aspect ratios
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
