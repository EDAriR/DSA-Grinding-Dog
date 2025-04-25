import os
import glob

def rename_files(directory, file_extensions):
    """重命名指定目錄中的檔案，移除檔案名中的指定字串"""
    renamed_count = 0
    renamed_files = []  # 追蹤已重命名的檔案
    errors = []  # 收集錯誤
    
    # 遍歷每個檔案副檔名
    for extension in file_extensions:
        # 獲取指定副檔名的所有檔案
        file_pattern = os.path.join(directory, f"*{extension}")
        files = glob.glob(file_pattern)
        
        for file_path in files:
            # 獲取檔案名和目錄
            dirname, filename = os.path.split(file_path)
            
            # 如果檔案名包含要移除的字串
            if extension in filename:
                # 創建新檔案名
                new_filename = filename.replace(extension, "")
                new_file_path = os.path.join(dirname, new_filename)
                
                # 重命名檔案
                try:
                    os.rename(file_path, new_file_path)
                    print(f"已重命名: {filename} -> {new_filename}")
                    renamed_count += 1
                    renamed_files.append({
                        "original_path": file_path,
                        "new_path": new_file_path,
                        "original_filename": filename,
                        "new_filename": new_filename
                    })
                except Exception as e:
                    errors.append(f"重命名 {filename} 失敗: {e}")
    
    # 如果有錯誤，一次性顯示所有錯誤
    if errors:
        print("\n發生以下錯誤:")
        for error in errors:
            print(error)
    
    return renamed_count, renamed_files

def restore_files(renamed_files):
    """還原所有已重命名的檔案"""
    if not renamed_files:
        return
        
    print("\n還原所有重命名的檔案...")
    errors = []
    
    # 反向遍歷以還原最近的更改
    for file_info in reversed(renamed_files):
        try:
            os.rename(file_info["new_path"], file_info["original_path"])
            print(f"已還原: {file_info['new_filename']} -> {file_info['original_filename']}")
        except Exception as e:
            errors.append(f"還原 {file_info['new_filename']} 至 {file_info['original_filename']} 失敗: {e}")
    
    if errors:
        print("\n發生以下錯誤:")
        for error in errors:
            print(error)

def main():
    download_dir = r"C:\Users\Downloads"
    extensions = [".xlsx", ".pdf", ".zip"]
    
    # 預設要移除的字串，您可以在這裡直接修改
    default_removal_string = "要移除的字串"  # 請修改為您需要的固定字串
    
    print("檔案重命名工具")
    print(f"將處理 {download_dir} 中的所有 {', '.join(extensions)} 檔案")
    
    
    # 執行重命名操作
    renamed_count, renamed_files = rename_files(download_dir, extensions)
    
    if renamed_count > 0:
        print(f"\n成功重命名 {renamed_count} 個檔案。")
    else:
        print(f"\n未找到包含 '{default_removal_string}' 的檔案。")
    
    print("\n按Enter鍵還原檔名並退出...")
    input()  # 等待使用者按Enter
    
    # 還原檔案
    restore_files(renamed_files)
    print("程序已退出。")

if __name__ == "__main__":
    main()