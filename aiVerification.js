const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const fs = require('fs');

let model = null;

//load model
const loadModel = async () => {
  if (!model) {
    console.log('Loading AI model...');
    model = await cocoSsd.load();
    console.log('AI model loaded!');
  }
  return model;
};

//verify if image contains a car or parking-related objects
const verifyParkingSpot = async (imagePath) => {
  try {
    const model = await loadModel();
    
    //read image
    const imageBuffer = fs.readFileSync(imagePath);
    const tfimage = tf.node.decodeImage(imageBuffer);
    
    //run detection
    const predictions = await model.detect(tfimage);
    
    //clean up
    tfimage.dispose();
    
    //check if car or parking-related objects detected
    const parkingRelated = ['car', 'truck', 'bus', 'motorcycle', 'bicycle'];
    const detected = predictions.filter(pred => 
      parkingRelated.includes(pred.class) && pred.score > 0.5
    );
    
    return {
      isValid: detected.length > 0,
      detectedObjects: detected.map(d => ({ class: d.class, confidence: d.score })),
      allPredictions: predictions
    };
  } catch (err) {
    console.error('AI verification error:', err);
    return { isValid: true, error: err.message }; //default to true if AI fails
  }
};

module.exports = { verifyParkingSpot };
