import Modal from "../../Common/Modal"
import DialogBox from "../../Common/DialogBox"
import { useTranslation } from 'react-i18next' // 新增导入
import { useTranslation } from 'react-i18next' // 新增导入
export default function InvalidRepo(props) {
  const { onDismiss, otherRepoOrBranchAvailable = false } = props
  const demoRepoUrl = 'https://github.com/nickcoutsos/zmk-config-corne-demo/'
  const { t } = useTranslation() // 获取翻译函数
  return (
    <Modal>
      <DialogBox onDismiss={onDismiss}>
        <h2>{t("invalid-repo.title")}</h2>
        <p>
          {t("invalid-repo.message-p1")}
        </p>
        <p>
           {t("invalid-repo.message-p2")}
          <a href={demoRepoUrl}>zmk-config-corne-demo</a>.
        </p>
        {otherRepoOrBranchAvailable && (
          <p>
             {t("invalid-repo.message-p3")}
          </p>
        )}
      </DialogBox>
    </Modal>
  )
}
