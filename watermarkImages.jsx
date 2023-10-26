var originalRulerUnits = app.preferences.rulerUnits;
app.preferences.rulerUnits = Units.PIXELS;

var srcFolder = Folder.selectDialog("Select a folder of images to watermark");
if (srcFolder != null) {
  var dstFolder = new Folder(srcFolder + "_watermark");
  if (!dstFolder.exists) {
    dstFolder.create();
  }

  var files = srcFolder.getFiles(function (file) {
    return (
      file instanceof File &&
      /\.(jpg|jpeg|png|tif|tiff|psd|bmp)$/i.test(file.name)
    );
  });

  for (var i = 0; i < files.length; i++) {
    var doc = open(files[i]);

    // 2. Rescale the image by 50%
    doc.resizeImage(doc.width * 0.5, doc.height * 0.5);

    // 3. Make a new text layer
    var textLayer = doc.artLayers.add();
    textLayer.kind = LayerKind.TEXT;
    textLayer.textItem.contents = "Copyright Dream Me Digital";
    textLayer.textItem.size = 40; // Set text size to 40px
    textLayer.opacity = 50; // Set layer opacity to 50%

    // Set text color to light gray
    textLayer.textItem.color.rgb.red = 211;
    textLayer.textItem.color.rgb.green = 211;
    textLayer.textItem.color.rgb.blue = 211;

    // 4. Rotate the text layer by 45 degrees
    var angle = 45;
    var rotateDescriptor = new ActionDescriptor();
    var rotateReference = new ActionReference();
    rotateReference.putEnumerated(
      charIDToTypeID("Lyr "),
      charIDToTypeID("Ordn"),
      charIDToTypeID("Trgt")
    );
    rotateDescriptor.putReference(charIDToTypeID("null"), rotateReference);
    rotateDescriptor.putUnitDouble(
      charIDToTypeID("Angl"),
      charIDToTypeID("#Ang"),
      angle
    );
    executeAction(charIDToTypeID("Trnf"), rotateDescriptor, DialogModes.NO);

    // 5. Position the text layer in a grid
    var gridSize = 400; // Define your preferred distance between the text placements
    for (var x = 0; x < doc.width; x += gridSize) {
      for (var y = 0; y < doc.height; y += gridSize) {
        var newTextLayer = textLayer.duplicate();
        newTextLayer.textItem.position = [x, y];
      }
    }

    // Delete the original text layer
    textLayer.remove();

    // 6. Export the image as PNG
    var saveFile = new File(
      dstFolder +
        "/" +
        decodeURI(files[i].name).replace(/\.[^\.]+$/, "_watermark.png")
    );
    var saveOptions = new PNGSaveOptions();
    doc.saveAs(saveFile, saveOptions, true, Extension.LOWERCASE);

    doc.close(SaveOptions.DONOTSAVECHANGES);
  }
}

app.preferences.rulerUnits = originalRulerUnits;
