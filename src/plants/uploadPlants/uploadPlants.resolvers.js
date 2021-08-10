import client from "../../client";
import { uploadToS3 } from "../../shared/shared.utils";
import { protectedResolver } from "../../users/users.utils";
import { processHashtags } from "../plants.utils";

export default {
  Mutation: {
    uploadPlants: protectedResolver(
      async (
        _,
        {
          images,
          title,
          caption,
          sunlight,
          temperatureMin,
          temperatureMax,
          water,
          plantDivision,
          plantClass,
          plantOrder,
          plantFamily,
          plantGenus,
          plantSpecies,
          plantHome,
          plantHabitat,
        },
        { loggedInUser }
      ) => {
        let hashtagObj = [];
        /// parse caption
        if (caption) {
          hashtagObj = processHashtags(caption);
        }

        const plantsData = await client.plants.create({
          data: {
            title,
            caption,
            sunlight,
            temperatureMax,
            temperatureMin,
            water,
            plantDivision,
            plantClass,
            plantOrder,
            plantFamily,
            plantGenus,
            plantSpecies,
            plantHome,
            plantHabitat,
            user: {
              connect: {
                id: loggedInUser.id,
              },
            },
            ...(hashtagObj.length > 0 && {
              hashtags: {
                connectOrCreate: hashtagObj,
              },
            }),
          },
        });

        for (let i = 0; i < images.length; i++) {
          await client.plantsImage.create({
            data: {
              file: images[i],
              plantsId: plantsData.id,
            },
          });
        }

        return plantsData;
      }
    ),
  },
};
