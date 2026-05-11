use std::collections::{BTreeSet, HashMap};

use super::types::{
    CompareConflict, CompareConflictReason, CompareResult, DeleteMode, MatchedPair, MediaFile, ScanResult,
};

pub fn compare_files(scan_result: ScanResult, mode: DeleteMode) -> CompareResult {
    let image_groups = group_by_key(&scan_result.image_files);
    let raw_groups = group_by_key(&scan_result.raw_files);
    let keys: BTreeSet<String> = image_groups.keys().chain(raw_groups.keys()).cloned().collect();
    let mut matched_pairs = Vec::new();
    let mut conflicts = Vec::new();
    let mut delete_candidates = Vec::new();

    for key in keys {
        let images = image_groups.get(&key).cloned().unwrap_or_default();
        let raws = raw_groups.get(&key).cloned().unwrap_or_default();

        if let Some(reason) = get_conflict_reason(&images, &raws) {
            let mut files = images.clone();
            files.extend(raws.clone());
            conflicts.push(CompareConflict { key, reason, files });
            continue;
        }

        let image = images.first().cloned();
        let raw = raws.first().cloned();

        if image.is_some() && raw.is_some() {
            matched_pairs.push(MatchedPair { key, image, raw });
            continue;
        }

        if mode == DeleteMode::JpgAsSourceDeleteRaw && image.is_none() {
            if let Some(raw) = raw {
                delete_candidates.push(raw);
            }
        } else if mode == DeleteMode::RawAsSourceDeleteJpg && raw.is_none() {
            if let Some(image) = image {
                delete_candidates.push(image);
            }
        }
    }

    let total_delete_size = delete_candidates.iter().map(|file| file.size).sum();

    CompareResult {
        mode,
        directory_mode: scan_result.directory_mode,
        image_files: scan_result.image_files,
        raw_files: scan_result.raw_files,
        matched_pairs,
        delete_candidates,
        conflicts,
        total_delete_size,
    }
}

fn group_by_key(files: &[MediaFile]) -> HashMap<String, Vec<MediaFile>> {
    let mut groups: HashMap<String, Vec<MediaFile>> = HashMap::new();
    for file in files {
        groups.entry(file.key.clone()).or_default().push(file.clone());
    }
    groups
}

fn get_conflict_reason(images: &[MediaFile], raws: &[MediaFile]) -> Option<CompareConflictReason> {
    if images.len() > 1 && raws.len() > 1 {
        Some(CompareConflictReason::AmbiguousMatch)
    } else if images.len() > 1 {
        Some(CompareConflictReason::DuplicateImage)
    } else if raws.len() > 1 {
        Some(CompareConflictReason::DuplicateRaw)
    } else {
        None
    }
}
