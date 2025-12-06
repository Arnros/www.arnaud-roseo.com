module.exports = function(eleventyConfig) {
  // Filtre pour formater les dates
  eleventyConfig.addFilter("date", function(date, format) {
    const d = new Date(date);
    if (format === "%Y-%m-%d") {
      return d.toISOString().split('T')[0];
    }
    if (format === "%d/%m/%Y") {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return d.toISOString();
  });

  // Copier les assets statiques
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/data");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/humans.txt");
  eleventyConfig.addPassthroughCopy("src/.nojekyll");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
