# Audio Assets

To use notification sounds, add `chime.mp3` to this directory.

The app will work without it, but notifications won't have audio alerts.

## Adding chime.mp3:
1. Find or create a notification sound (MP3 format)
2. Place it in this `public/` folder as `chime.mp3`
3. Rebuild/redeploy your app

## Recommended sources:
- https://freesound.org/ (search for "notification chime")
- https://mixkit.co/free-sound-effects/notification/

The file will be automatically served and used by the ToastContext for notification sounds.
