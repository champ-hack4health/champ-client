import React from "react";
import * as Expo from "expo";
import * as ImagePicker from "expo-image-picker";
import uuid from "uuid-random";
import {
  Button,
  FAB,
  IconButton,
  Paragraph,
  Dialog,
  Portal,
  Modal
} from "react-native-paper";

import {
  ActivityIndicator,
  Clipboard,
  FlatList,
  Image,
  Share,
  StyleSheet,
  Text,
  ScrollView,
  View,
} from "react-native";
import Environment from "./config/environment";
import firebase from "./config/firebase";

export default class App extends React.Component {
  state = {
    image: null,
    uploading: false,
    googleResponse: null,
	visible: true,
  };

  async componentDidMount() {}

  render() {
    let { image } = this.state;
	
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.getStartedContainer}>
            {image ? null : (
              <Image
                source={{
                  uri: "https://res.cloudinary.com/duehwryfv/image/upload/v1621759036/Screen_Shot_2021-05-23_at_1.33.06_AM_fnyrnv.png",
                }}
                style={{ width: 450, height: 500 }}
              />
            )}
          </View>

          <View style={styles.helpContainer}>
            {this._maybeRenderImage()}
            {this._maybeRenderUploadingOverlay()}
            <Button
              onPress={this._pickImage}
              title="Pick an image from camera roll"
            />
            {image ? null :  <Button
              icon="camera-outline"
              mode="outlined"
              style={styles.fab}
              onPress={this._takePhoto}
              title="Take a photo"
            >
              Camera
            </Button> }
            {this.state.googleResponse && (
              <FlatList
                data={this.state.googleResponse.responses[0].labelAnnotations}
                extraData={this.state}
                keyExtractor={this._keyExtractor}
                renderItem={({ item }) => <Text>Item: {item.description}</Text>}
              />
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  organize = (array) => {
    return array.map(function (item, i) {
      return (
        <View key={i}>
          <Text>{item}</Text>
        </View>
      );
    });
  };

  _maybeRenderUploadingOverlay = () => {
    if (this.state.uploading) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      );
    }
  };

  _maybeRenderImage = () => {
    let { image, googleResponse } = this.state;
    if (!image) {
      return;
    }

    return (
      <View
        style={{
          marginTop: 20,
          width: 600,
		  alignItems: "center",
          borderRadius: 3,
          elevation: 2,
        }}
      >
        <View
          style={{
            borderTopRightRadius: 3,
            borderTopLeftRadius: 3,
            shadowColor: "rgba(0,0,0,1)",
            shadowOpacity: 0.2,
            shadowOffset: { width: 4, height: 4 },
            shadowRadius: 5,
            overflow: "hidden",
          }}
        >
          <Image source={{ uri: image }} style={{ width: 240, height: 240 }} />
        </View>
        <Text
          onPress={this._copyToClipboard}
          onLongPress={this._share}
          style={{ paddingVertical: 10, paddingHorizontal: 10 }}
        />
        <Paragraph>Would you like to upload this picture?</Paragraph>
        <View style={{flexDirection: "row"}}>
          <View style={{padding:10}}>
            <Button
			  icon="check-outline"
              mode="contained"
              style={{ marginBottom: 10 }}
              onPress={() => this.submitToGoogle()}
              title="Verify"
            >
              Verify
            </Button>
          </View>
		  
          <View style={{padding:10}}>
            <Button
              icon="camera-outline"
              mode="contained"
              onPress={this._takePhoto}
              title="Take a photo"
            >
              Camera
            </Button>
          </View>
        </View>
    
        { googleResponse== null? null : 
			!this._detectBycle(googleResponse) ?
		  <Modal visible={this.state.visible} onDismiss={false} contentContainerStyle={containerStyle}>
          <Text>Perfect Gina! Keep it up :)</Text>
          </Modal>
         : <Modal visible={this.state.visible} onDismiss={false} contentContainerStyle={containerStyle}>
          <Text>Oops! Seems like it's not a right photo. Do you want to retake it?</Text>
        </Modal>
		}
      </View>
    );
  };

  _detectBycle = async (googleResponse) => {
	  if(!responseList) return false
	  let returnVal = false
	  let responseList = googleResponse.responses[0].labelAnnotations[0].description 
	  responseList.forEach(element => {
		  if(element.description =="Bicycle") {
			  returnVal = true
		  }
	});
	this._showModal()
	return returnVal
  };

  _showModal = () => this.setState({visible: true});
  _hideModal = () => {
	  if(this.state.visible = true) this.setState({visible: false});
  }
  _keyExtractor = (item, index) => item.id;

  _renderItem = (item) => {
    <Text>response: {JSON.stringify(item)}</Text>;
  };

  _share = () => {
    Share.share({
      message: JSON.stringify(this.state.googleResponse.responses),
      title: "Check it out",
      url: this.state.image,
    });
  };

  _copyToClipboard = () => {
    Clipboard.setString(this.state.image);
    alert("Copied to clipboard");
  };

  _takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    this._handleImagePicked(pickerResult);
  };

  _pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    this._handleImagePicked(pickerResult);
  };

  _handleImagePicked = async (pickerResult) => {
    try {
      this.setState({ uploading: true });

      if (!pickerResult.cancelled) {
        uploadUrl = await uploadImageAsync(pickerResult.uri);
        this.setState({ image: uploadUrl });
      }
    } catch (e) {
      console.log(e);
      alert("Upload failed, sorry :(");
    } finally {
      this.setState({ uploading: false });
    }
  };

  submitToGoogle = async () => {
    try {
      this.setState({ uploading: true });
      let { image } = this.state;
      let body = JSON.stringify({
        requests: [
          {
            features: [
              { type: "LABEL_DETECTION", maxResults: 10 },
              { type: "LANDMARK_DETECTION", maxResults: 5 },
              { type: "FACE_DETECTION", maxResults: 5 },
              { type: "LOGO_DETECTION", maxResults: 5 },
              { type: "TEXT_DETECTION", maxResults: 5 },
              { type: "DOCUMENT_TEXT_DETECTION", maxResults: 5 },
              { type: "SAFE_SEARCH_DETECTION", maxResults: 5 },
              { type: "IMAGE_PROPERTIES", maxResults: 5 },
              { type: "CROP_HINTS", maxResults: 5 },
              { type: "WEB_DETECTION", maxResults: 5 },
            ],
            image: {
              source: {
                imageUri: image,
              },
            },
          },
        ],
      });

      console.log(image);
      let response = await fetch(
        "https://vision.googleapis.com/v1/images:annotate?key=" +
          Environment["GOOGLE_CLOUD_VISION_API_KEY"],
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "POST",
          body: body,
        }
      );
      let responseJson = await response.json();
      this.setState({
        googleResponse: responseJson,
        uploading: false,
      });
    } catch (error) {
      console.log(error);
    }
  };
}

const containerStyle = {backgroundColor: 'white', padding: 20};

async function uploadImageAsync(uri) {
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

  const ref = firebase.storage().ref().child(uuid());
  const snapshot = await ref.put(blob);

  blob.close();

  return await snapshot.ref.getDownloadURL();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 10,
  },
  developmentModeText: {
    marginBottom: 20,
    color: "rgba(0,0,0,0.4)",
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
  contentContainer: {
    paddingTop: 30,
  },

  getStartedContainer: {
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 100,
  },
  getStartedText: {
    fontSize: 17,
    color: "rgba(96,100,109, 1)",
    lineHeight: 24,
    textAlign: "center",
  },

  helpContainer: {
    marginTop: 180,
    alignItems: "center",
  },
});
