import DialogBox from "../../Common/DialogBox"
import Modal from "../../Common/Modal"
import './ValidationErrors.css'; // 新增样式文件
import { useTranslation } from 'react-i18next' // 新增导入
function fileFromTitle(title) {
  if (title === 'InfoValidationError') {
    return 'config/info.json'
  } else if (title === 'KeymapValidationError') {
    return 'config/keymap.json'
  }
}





export default function ValidationErrors(props) {
  const { onDismiss, title, errors,  otherRepoOrBranchAvailable = false } = props
  const file = fileFromTitle(title)
  const { t } = useTranslation() // 获取翻译函数
  return (
    <Modal>
      <DialogBox onDismiss={onDismiss}>
        <h2 className='header'>{title}</h2>
        {file && (
          <p>t("Errors in the file") <code>{file}</code>.</p>
        )}
        <ul className='list'>
          {errors.map((error, i) => (
            <li key={i} className='listItem'>
              {error}
            </li>
          ))}
        </ul>

        {otherRepoOrBranchAvailable && (
          <p>
           t('invalid-repo.message-p3')
          </p>
        )}
      </DialogBox>
    </Modal>
  )
}