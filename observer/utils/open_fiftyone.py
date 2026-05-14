import fiftyone as fo

dataset = fo.Dataset.from_videos_dir(
    r"C:\smart-boss-files\from video\weight_posission\base videos\WhatsApp Video 2026-02-09 at 18.33.59.mp4"
)

session = fo.launch_app(dataset)
session.wait()
