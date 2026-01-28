from models.registry import registry
from models.vision.clip_model import load_clip_model
from models.embeddings.text_embedding import load_text_embedding_model

def load_all_models():
    registry.clip_model = load_clip_model()
    registry.text_embedding_model = load_text_embedding_model()
