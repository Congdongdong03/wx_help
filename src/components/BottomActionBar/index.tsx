import React from "react";
import { View, Button } from "@tarojs/components";

interface BottomActionBarProps {
  onSaveDraft: () => void;
  onPublish: () => void;
  isSavingDraft?: boolean;
  isPublishing?: boolean;
  saveDraftText?: string;
  publishText?: string;
  saveDraftLoadingText?: string;
  publishLoadingText?: string;
}

const BottomActionBar = ({
  onSaveDraft,
  onPublish,
  isSavingDraft = false,
  isPublishing = false,
  saveDraftText = "保存草稿",
  publishText = "发布",
  saveDraftLoadingText = "保存中...",
  publishLoadingText = "发布中...",
}) => {
  return (
    <View className="form-actions-container">
      <Button
        className="save-draft-button"
        onClick={onSaveDraft}
        loading={isSavingDraft}
        disabled={isSavingDraft || isPublishing}
      >
        {isSavingDraft ? saveDraftLoadingText : saveDraftText}
      </Button>
      <Button
        className="submit-button"
        onClick={onPublish}
        loading={isPublishing}
        disabled={isSavingDraft || isPublishing}
      >
        {isPublishing ? publishLoadingText : publishText}
      </Button>
    </View>
  );
};

export default BottomActionBar;
