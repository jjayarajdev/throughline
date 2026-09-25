namespace EpicenterX.Application.Extensions.HelperMethods
{
    public class FileHelper
    {
        public static List<(string FileName, string Extension, string FileWithExtension)> GetFilesWithDetails(string folderPath, bool includeSubfolders = false)
        {
            var files = Directory.GetFiles(
                folderPath,
                "*.*",
                includeSubfolders ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly);

            var result = new List<(string FileName, string Extension, string FileWithExtension)>();

            foreach (var file in files)
            {
                string fileName = Path.GetFileNameWithoutExtension(file);   // name only
                string extension = Path.GetExtension(file);                 // extension only
                string fileWithExtension = Path.GetFileName(file);          // name + extension

                result.Add((fileName, extension, fileWithExtension));
            }

            return result;
        }
    }
}
