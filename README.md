Dropbox PencilBlue
==

A plugin that allows for Dropbox to be the media storage for the platform.

First and foremost:  If at any point you have questions, comments or concerns you can find us hanging out on 
twitter [@getpencilblue](https://twitter.com/GetPencilBlue) and on our 
[Sub-Reddit](http://www.reddit.com/domain/pencilblue.org/).  We're always happy to help and pull requests (plugin 
or core) are always welcome. 

Pre-requisits:

1) Create an app at: https://www.dropbox.com/developers/apps

2) Click “Dropbox API App”

3) Click “Files and Datastores”

4) Click “Yes My app only needs access to files it creates.”

5) Fill in the app name

6) Click “Create App”

7) Under “Settings” => “OAuth” click the “Generate” button

8) Copy the App Key, App Secret, and Access Token for later use

Installation:

1) Clone repo into your PencilBlue's **plugins** directory.

2) Edit your **config.js** file to configure the media provider
```
{
  "media": {
    "provider": "/plugins/dropbox-pencilblue/include/db_media_provider.js"
  }
}
```
3) Start or restart your PB instance

4) Navigate to **Manage Plugins** section in PencilBlue

5) Install the **dropbox-pencilblue** plugin

6) Upon successful install click the **Settings** button for the dropbox-pencilblue plugin

7) Enter your Dropbox **App Key**, **App Secret** and **Access Token**

8) Click **Save**

You should be good to go!

**NOTE:**
Currently there is no way to migrate data from one media provider to the other.  If "uploaded" media already exists 
that was created from a different provider then you must delete it and upload it.  You will also have to re-link any 
system objects that rely on that media until you can replace the content for a media object.  See 
https://github.com/pencilblue/pencilblue/issues/218
