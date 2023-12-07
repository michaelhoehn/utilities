// Prompt the user to select the folder containing the images
var inputFolder = Folder.selectDialog("Select a folder of images");

if (inputFolder !== null) {
  // Filter for specific image file types in the folder
  var fileList = inputFolder.getFiles(function (file) {
    return (
      file instanceof File && file.name.match(/\.(jpg|jpeg|png|tif|tiff|bmp)$/i)
    );
  });

  if (fileList.length > 0) {
    // Open the first image to determine the dimensions
    var firstImg = app.open(fileList[0]);
    var imgWidth = firstImg.width / 2; // Scaled down size
    var imgHeight = firstImg.height / 2; // Scaled down size
    firstImg.close(SaveOptions.DONOTSAVECHANGES);

    var rows = Math.ceil(Math.sqrt(fileList.length));
    var cols = Math.ceil(fileList.length / rows);

    // Create a new document to hold the collage
    var newDoc = app.documents.add(imgWidth * cols, imgHeight * rows);

    // Use a white background
    var bgColor = new SolidColor();
    bgColor.rgb.red = 255;
    bgColor.rgb.green = 255;
    bgColor.rgb.blue = 255;
    newDoc.selection.selectAll();
    newDoc.selection.fill(bgColor);
    newDoc.selection.deselect();

    // Loop through each file, open, resize, and copy to the new document
    for (var i = 0; i < fileList.length; i++) {
      try {
        var doc = app.open(fileList[i]);

        // Resize the image to half its original size
        doc.resizeImage(imgWidth, imgHeight);

        // Copy the entire image
        doc.selection.selectAll();
        doc.selection.copy();
        doc.close(SaveOptions.DONOTSAVECHANGES);

        // Paste the image into the collage document
        newDoc.paste();

        // Calculate the x and y position for the image
        var x = (i % cols) * imgWidth;
        var y = Math.floor(i / cols) * imgHeight;

        // Translate/move the pasted layer to the right position
        var layer = newDoc.activeLayer;
        layer.translate(
          x - (newDoc.width - imgWidth) / 2,
          y - (newDoc.height - imgHeight) / 2
        );

        // Merge the layer down
        layer.merge();
      } catch (e) {
        alert(
          "Error processing image #" +
            (i + 1) +
            ": " +
            fileList[i].name +
            "\nError message: " +
            e.toString()
        );
        // Continue processing the next images even if one fails
        continue;
      }
    }
  } else {
    alert("No valid images found in the selected folder.");
  }
}
