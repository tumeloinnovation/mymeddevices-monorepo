"""
Profanity Filter Service

Detects and flags inappropriate language in reviews.
Uses a combination of word lists and pattern matching.
"""

import re

# Profanity word list - can be extended or loaded from external source
PROFANITY_WORDS = {
    # Common swear words (sample list - should be expanded based on requirements)
    "fuck",
    "shit",
    "damn",
    "hell",
    "ass",
    "bitch",
    "bastard",
    # Slurs and offensive terms (placeholder - should be properly curated)
    # Add more words as needed based on community guidelines
}

# Pattern for detecting obfuscated profanity with symbols (e.g., f*ck, sh!t, a$$)
PROFANITY_PATTERN = re.compile(r"\b[a-z]*[*@#$%&!]+[a-z]*\b", re.IGNORECASE)


class ProfanityFilterService:
    """Service for detecting and filtering profanity in text."""

    def __init__(self):
        self.profanity_words = PROFANITY_WORDS
        self.pattern = PROFANITY_PATTERN

    def check_text(self, text: str | None) -> tuple[bool, list[str]]:
        """
        Check text for profanity.

        Args:
            text: The text to check

        Returns:
            Tuple of (contains_profanity: bool, flagged_words: List[str])
        """
        if not text:
            return False, []

        flagged_words = []
        text_lower = text.lower()

        # Check for direct word matches using word boundaries
        for word in self.profanity_words:
            pattern = re.compile(r"\b" + re.escape(word) + r"\b", re.IGNORECASE)
            if pattern.search(text_lower):
                flagged_words.append(word)

        # Check for obfuscated patterns
        pattern_matches = self.pattern.findall(text)
        flagged_words.extend(pattern_matches)

        # Remove duplicates while preserving order
        seen = set()
        unique_flagged = []
        for word in flagged_words:
            if word.lower() not in seen:
                seen.add(word.lower())
                unique_flagged.append(word)

        return len(unique_flagged) > 0, unique_flagged

    def sanitize_text(self, text: str, replacement: str = "***") -> str:
        """
        Replace profanity in text with replacement string.

        Args:
            text: The text to sanitize
            replacement: String to replace profanity with (default: "***")

        Returns:
            Sanitized text
        """
        if not text:
            return text

        result = text
        for word in self.profanity_words:
            # Case-insensitive replacement
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            result = pattern.sub(replacement, result)

        # Also replace pattern matches
        result = self.pattern.sub(replacement, result)

        return result


# Singleton instance
profanity_filter = ProfanityFilterService()
