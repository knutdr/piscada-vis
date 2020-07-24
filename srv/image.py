import numpy as np
import matplotlib.pyplot as plt
import json
import os.path

def getImage(img_url: str, json_url: str)->None:
    """
        gets an and saves it as a json file
        Args:
            img_url: url to image file
            json_url: url to json file

    """
    if(os.path.isfile(img_url)):
        print('importing image...')
        img = plt.imread(img_url)
        img_list = img.tolist()
        obj = {
            'samples': img_list
        }
        print('getting json from array...')
        with open(json_url, 'w') as json_file:
            json.dump(obj, json_file)
        print('success!')

if __name__ == '__main__':
    json_url = 'res/data/sonar-test.json'
    img_url = 'res/textures/sonar-test.png'
    getImage(img_url, json_url)
