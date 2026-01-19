import Genre from "../models/Genre.js";
import Novel from "../models/Novel.js";
import AppError from "../middlewares/errorHandler.js";
import slugify from "../utils/slugify.js";
import { normalizeGenreName } from "../utils/normalizeGenreName.js";

const buildFilter = (includeInactive) => {
  if (includeInactive) return {};
  return { isActive: true };
};

export const getGenres = async (req, res, next) => {
  try {
    const genres = await Genre.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    res.json({ success: true, genres });
  } catch (error) {
    next(error);
  }
};

export const adminGetGenres = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const genres = await Genre.find(buildFilter(includeInactive))
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    res.json({ success: true, genres });
  } catch (error) {
    next(error);
  }
};

export const createGenre = async (req, res, next) => {
  try {
    const { name, description, isActive = true, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError("Tên thể loại là bắt buộc", 400));
    }

    const normalizedName = normalizeGenreName(name);
    if (!normalizedName) {
      return next(new AppError("Tên thể loại không hợp lệ", 400));
    }
    const slug = slugify(normalizedName);
    if (!slug) {
      return next(new AppError("Tên thể loại không hợp lệ", 400));
    }

    const existing = await Genre.findOne({ slug });
    if (existing) {
      return next(new AppError("Thể loại đã tồn tại", 409));
    }

    const numericDisplayOrder = Number(displayOrder);
    let orderValue = Number.isFinite(numericDisplayOrder) ? numericDisplayOrder : null;
    if (orderValue === null) {
      const lastGenre = await Genre.findOne().sort({ displayOrder: -1 }).select("displayOrder").lean();
      orderValue = (lastGenre?.displayOrder ?? 0) + 1;
    }

    const resolvedIsActive = typeof isActive === "boolean" ? isActive : Boolean(isActive ?? true);

    const genre = await Genre.create({
      name: normalizedName,
      slug,
      description: description?.trim() || "",
      isActive: resolvedIsActive,
      displayOrder: orderValue,
      createdBy: req.user?.userId || null,
    });

    res.status(201).json({ success: true, genre });
  } catch (error) {
    next(error);
  }
};

export const updateGenre = async (req, res, next) => {
  try {
    const { genreId } = req.params;
    const { name, description, isActive, displayOrder } = req.body;

    const genre = await Genre.findById(genreId);
    if (!genre) {
      return next(new AppError("Không tìm thấy thể loại", 404));
    }

    const previousName = genre.name;

    if (typeof name === "string") {
      const normalizedName = normalizeGenreName(name);
      if (!normalizedName) {
        return next(new AppError("Tên thể loại không hợp lệ", 400));
      }
      const nextSlug = slugify(normalizedName);
      if (!nextSlug) {
        return next(new AppError("Tên thể loại không hợp lệ", 400));
      }

      const duplicate = await Genre.findOne({ slug: nextSlug, _id: { $ne: genreId } });
      if (duplicate) {
        return next(new AppError("Thể loại đã tồn tại", 409));
      }

      genre.name = normalizedName;
      genre.slug = nextSlug;
    }

    if (typeof description === "string") {
      genre.description = description.trim();
    }

    if (typeof isActive === "boolean") {
      genre.isActive = isActive;
    }

    const parsedOrder = Number(displayOrder);
    if (Number.isFinite(parsedOrder)) {
      genre.displayOrder = parsedOrder;
    }

    await genre.save();

    if (typeof name === "string") {
      const normalizedName = normalizeGenreName(name);
      if (normalizedName && normalizedName !== previousName) {
        await Novel.updateMany(
          { genres: previousName },
          { $set: { "genres.$[g]": normalizedName } },
          { arrayFilters: [{ g: previousName }] }
        );
      }
    }

    res.json({ success: true, genre });
  } catch (error) {
    next(error);
  }
};

export const deleteGenre = async (req, res, next) => {
  try {
    const { genreId } = req.params;
    const deleted = await Genre.findByIdAndDelete(genreId);
    if (!deleted) {
      return next(new AppError("Không tìm thấy thể loại", 404));
    }

    await Novel.updateMany(
      { genres: deleted.name },
      { $pull: { genres: deleted.name } }
    );

    res.json({ success: true, genreId });
  } catch (error) {
    next(error);
  }
};
