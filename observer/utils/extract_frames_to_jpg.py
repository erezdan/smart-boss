import cv2
from pathlib import Path
from PIL import Image

def extract_frames_to_jpg(video_path: str, prefix_num: int, frames_per_second: float, jpg_quality: int = 85):
    """
    Extract frames from an mp4 video at a given FPS rate and save as JPG images.
    Creates an output folder next to the video file with the same base name.

    :param video_path: Full path to mp4 file
    :param frames_per_second: Number of frames to extract per second
    :param jpg_quality: JPEG quality (0-100). Lower = smaller files
    """

    video_path = Path(video_path)
    if not video_path.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    # Create output directory next to video
    output_dir = video_path.parent / f"{prefix_num}_{video_path.stem}"
    output_dir.mkdir(exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError("Failed to open video file")

    source_fps = cap.get(cv2.CAP_PROP_FPS)
    if source_fps <= 0:
        raise RuntimeError("Could not read video FPS")

    # Compute frame step
    step = max(int(round(source_fps / frames_per_second)), 1)

    frame_index = 0
    saved_index = 0

    jpg_params = [int(cv2.IMWRITE_JPEG_QUALITY), int(jpg_quality)]

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Save every Nth frame
        if frame_index % step == 0:
            out_name = output_dir / f"frame_{prefix_num}_{saved_index:06d}.jpg"
            cv2.imwrite(str(out_name), frame, jpg_params)
            saved_index += 1

        frame_index += 1

    cap.release()

    print(f"Done. Saved {saved_index} frames to: {output_dir}")


def extract_frames_from_videos_in_folder(folder_path: str,
                                         frames_per_second: float,
                                         jpg_quality: int = 85,
                                         extensions=(".mp4", ".avi", ".mov", ".mkv")):
    """
    Iterate over all video files in a folder and extract frames using extract_frames_to_jpg.

    :param folder_path: Path to folder containing video files
    :param frames_per_second: Number of frames to extract per second
    :param jpg_quality: JPEG quality (0-100)
    :param extensions: Video file extensions to include
    """

    folder = Path(folder_path)
    if not folder.exists():
        raise FileNotFoundError(f"Folder not found: {folder}")

    video_files = [
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in extensions
    ]

    if not video_files:
        print("No video files found")
        return

    prefix_num = 1
    for video_path in video_files:
        print(f"Processing: {video_path.name}")
        try:
            extract_frames_to_jpg(
                video_path=str(video_path),
                prefix_num=prefix_num,
                frames_per_second=frames_per_second,
                jpg_quality=jpg_quality
            )
        except Exception as e:
            print(f"Failed processing {video_path.name}: {e}")
        prefix_num += 1

def convert_png_folder_to_jpg_and_delete_png(folder_path: str, jpg_quality: int = 85):
    """
    Convert all PNG images in a folder to JPG and delete the original PNG files.

    :param folder_path: Path to folder containing PNG images
    :param jpg_quality: JPEG quality (1-100). Lower = smaller files
    """

    folder = Path(folder_path)

    if not folder.exists():
        raise FileNotFoundError(f"Folder not found: {folder}")

    png_files = list(folder.glob("*.png"))
    if not png_files:
        print("No PNG files found")
        return

    for png_path in png_files:
        try:
            jpg_path = png_path.with_suffix(".jpg")

            # Open and convert to RGB (required for JPG)
            with Image.open(png_path) as img:
                rgb_img = img.convert("RGB")
                rgb_img.save(jpg_path, "JPEG", quality=jpg_quality, optimize=True)

            # Delete original PNG
            png_path.unlink()

            print(f"Converted: {png_path.name} -> {jpg_path.name}")

        except Exception as e:
            print(f"Failed on {png_path.name}: {e}")

    print("Done.")
