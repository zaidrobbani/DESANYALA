module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Type yang diizinkan
    "type-enum": [
      2,
      "always",
      [
        "feat", // Fitur baru
        "fix", // Bug fix
        "chore", // Pemeliharaan (dependency update, konfigurasi, dll.)
        "docs", // Perubahan dokumentasi
        "style", // Perubahan format/styling (tidak mempengaruhi logic)
        "refactor", // Refactoring kode (bukan feat, bukan fix)
        "test", // Menambah atau memperbaiki test
        "perf", // Peningkatan performa
        "ci", // Perubahan CI/CD pipeline
        "build", // Perubahan build system atau external dependency
        "revert", // Revert commit sebelumnya
      ],
    ],
    // Subject harus lowercase
    "subject-case": [2, "always", "lower-case"],
    // Subject tidak boleh kosong
    "subject-empty": [2, "never"],
    // Subject tidak boleh diakhiri tanda titik
    "subject-full-stop": [2, "never", "."],
    // Header maksimal 100 karakter
    "header-max-length": [2, "always", 100],
    // Type tidak boleh kosong
    "type-empty": [2, "never"],
    // Scope bersifat opsional
    "scope-empty": [0],
    // Body & footer kosong juga diperbolehkan
    "body-leading-blank": [1, "always"],
    "footer-leading-blank": [1, "always"],
  },
};
